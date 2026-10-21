-- V1: payment slips, booking status, schedule price, audit log.
-- Additive only: no DROP / TRUNCATE. MySQL 8.0+. BACK UP FIRST: mysqldump bus_seat_booking_system > backup.sql
-- Run once:  mysql -u root -p bus_seat_booking_system < db/migration/V1__payments_and_booking_status.sql

-- NOTE: MySQL DDL auto-commits, so this script cannot be rolled back as a unit. Use V1__rollback.sql if needed.

-- 1) Ticket price per schedule (expected payment amount). Existing rows default to 0.00: SET REAL PRICES before go-live.
ALTER TABLE schedules
    ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 2) Bookings: owner passenger, lifecycle status, amount snapshot, audit timestamps.
ALTER TABLE bookings
    ADD COLUMN passenger_id    INT NULL,
    ADD COLUMN booking_status  VARCHAR(20) NOT NULL DEFAULT 'PENDING_PAYMENT',
    ADD COLUMN amount          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Bookings that existed before the payment workflow are treated as already settled.
UPDATE bookings SET booking_status = 'CONFIRMED';

-- Link legacy bookings to a passenger only where the phone number matches exactly one passenger.
UPDATE bookings b
   JOIN (SELECT phone_number, MIN(passenger_id) AS pid
           FROM passengers GROUP BY phone_number HAVING COUNT(*) = 1) p
     ON p.phone_number = b.phone_number
   SET b.passenger_id = p.pid
 WHERE b.passenger_id IS NULL;

ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_passenger FOREIGN KEY (passenger_id) REFERENCES passengers (passenger_id),
    ADD CONSTRAINT chk_booking_status CHECK (booking_status IN ('PENDING_PAYMENT','CONFIRMED','CANCELLED')),
    ADD INDEX idx_bookings_passenger (passenger_id),
    ADD INDEX idx_bookings_schedule_status (schedule_id, booking_status),
    ADD UNIQUE INDEX uq_bookings_reference (booking_reference);

-- 3) Double-booking guard at database level. A seat is "held" unless its booking is CANCELLED.
--    NULLs never collide in a UNIQUE index, so cancelled bookings free the seat.
--    If this fails with a duplicate-key error, you have existing double bookings: resolve them first.
ALTER TABLE bookings
    ADD COLUMN active_seat_id INT GENERATED ALWAYS AS (IF(booking_status = 'CANCELLED', NULL, seat_id)) STORED,
    ADD UNIQUE INDEX uq_bookings_active_seat (schedule_id, active_seat_id);

-- 4) Payments: one row per booking; resubmission after rejection updates the row, history lives in the audit log.
CREATE TABLE payments (
    payment_id            INT AUTO_INCREMENT PRIMARY KEY,
    payment_reference     VARCHAR(30)   NOT NULL,
    booking_id            INT           NOT NULL,
    passenger_id          INT           NOT NULL,
    amount                DECIMAL(10,2) NOT NULL,
    transaction_reference VARCHAR(100)  NOT NULL,
    payment_method        VARCHAR(30)   NOT NULL DEFAULT 'BANK_TRANSFER',
    slip_stored_name      VARCHAR(80)   NOT NULL,
    slip_original_name    VARCHAR(255)  NULL,
    slip_content_type     VARCHAR(100)  NOT NULL,
    slip_size_bytes       BIGINT        NOT NULL,
    slip_sha256           CHAR(64)      NOT NULL,
    payment_status        VARCHAR(30)   NOT NULL DEFAULT 'PENDING_VERIFICATION',
    uploaded_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_by           INT           NULL,
    verified_at           TIMESTAMP     NULL,
    rejection_reason      VARCHAR(500)  NULL,
    resubmission_count    INT           NOT NULL DEFAULT 0,
    created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_payments_reference UNIQUE (payment_reference),
    CONSTRAINT uq_payments_booking   UNIQUE (booking_id),
    CONSTRAINT fk_payments_booking   FOREIGN KEY (booking_id)   REFERENCES bookings (booking_id),
    CONSTRAINT fk_payments_passenger FOREIGN KEY (passenger_id) REFERENCES passengers (passenger_id),
    CONSTRAINT fk_payments_admin     FOREIGN KEY (verified_by)  REFERENCES admin_users (admin_id),
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('PENDING_VERIFICATION','VERIFIED','REJECTED')),
    CONSTRAINT chk_payment_reject_reason CHECK (payment_status <> 'REJECTED' OR rejection_reason IS NOT NULL),
    INDEX idx_payments_status_uploaded (payment_status, uploaded_at),
    INDEX idx_payments_passenger (passenger_id),
    INDEX idx_payments_txn (transaction_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) Append-only audit trail of every payment state change.
CREATE TABLE payment_audit_log (
    audit_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id   INT          NOT NULL,
    action       VARCHAR(30)  NOT NULL,        -- SUBMITTED, RESUBMITTED, APPROVED, REJECTED
    from_status  VARCHAR(30)  NULL,
    to_status    VARCHAR(30)  NOT NULL,
    actor_type   VARCHAR(20)  NOT NULL,        -- PASSENGER or ADMIN
    actor_id     INT          NOT NULL,
    note         VARCHAR(500) NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_payment FOREIGN KEY (payment_id) REFERENCES payments (payment_id),
    INDEX idx_audit_payment (payment_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
