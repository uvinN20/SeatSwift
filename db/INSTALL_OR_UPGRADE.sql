-- Fresh-install base schema for SeatSwift (MySQL 8.0+).
-- This file installs or upgrades the known SeatSwift base/payment schema.
-- Rerunnable; existing passengers, trips, payments and bookings are preserved.
CREATE DATABASE IF NOT EXISTS bus_seat_booking_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE bus_seat_booking_system;

CREATE TABLE IF NOT EXISTS admin_users (
    admin_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS passengers (
    passenger_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    passenger_name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    phone_number VARCHAR(40) NOT NULL,
    password VARCHAR(255) NOT NULL,
    INDEX idx_passengers_phone (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS routes (
    route_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    UNIQUE KEY uq_routes_source_destination (source, destination)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS buses (
    bus_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    travel_date DATE NOT NULL,
    travel_time TIME NOT NULL,
    total_seats INT NOT NULL,
    CONSTRAINT fk_buses_route FOREIGN KEY (route_id) REFERENCES routes(route_id),
    INDEX idx_buses_route_date (route_id, travel_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS schedules (
    schedule_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    bus_id INT NOT NULL,
    travel_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    CONSTRAINT fk_schedules_route FOREIGN KEY (route_id) REFERENCES routes(route_id),
    CONSTRAINT fk_schedules_bus FOREIGN KEY (bus_id) REFERENCES buses(bus_id),
    INDEX idx_schedules_search (route_id, travel_date, departure_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS seats (
    seat_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    bus_id INT NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_seats_bus FOREIGN KEY (bus_id) REFERENCES buses(bus_id),
    UNIQUE KEY uq_seats_bus_number (bus_id, seat_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    seat_id INT NOT NULL,
    passenger_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(40) NOT NULL,
    booking_reference VARCHAR(40) NULL,
    CONSTRAINT fk_bookings_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id),
    CONSTRAINT fk_bookings_seat FOREIGN KEY (seat_id) REFERENCES seats(seat_id),
    INDEX idx_bookings_schedule_seat (schedule_id, seat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELIMITER $$
DROP PROCEDURE IF EXISTS seatswift_upgrade$$
CREATE PROCEDURE seatswift_upgrade()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='schedules' AND column_name='price') THEN
    ALTER TABLE schedules ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='bookings' AND column_name='passenger_id') THEN
    ALTER TABLE bookings ADD COLUMN passenger_id INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='bookings' AND column_name='booking_status') THEN
    ALTER TABLE bookings ADD COLUMN booking_status VARCHAR(20) NOT NULL DEFAULT 'PENDING_PAYMENT';
    UPDATE bookings SET booking_status='CONFIRMED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='bookings' AND column_name='amount') THEN
    ALTER TABLE bookings ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='bookings' AND column_name='created_at') THEN
    ALTER TABLE bookings ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='bookings' AND column_name='updated_at') THEN
    ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='bookings' AND column_name='active_seat_id') THEN
    ALTER TABLE bookings ADD COLUMN active_seat_id INT GENERATED ALWAYS AS (IF(booking_status = 'CANCELLED', NULL, seat_id)) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='bookings' AND index_name='uq_bookings_active_seat') THEN
    ALTER TABLE bookings ADD UNIQUE INDEX uq_bookings_active_seat (schedule_id, active_seat_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='bookings' AND index_name='uq_bookings_reference') THEN
    ALTER TABLE bookings ADD UNIQUE INDEX uq_bookings_reference (booking_reference);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='bookings' AND index_name='idx_bookings_passenger') THEN
    ALTER TABLE bookings ADD INDEX idx_bookings_passenger (passenger_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='bookings' AND index_name='idx_bookings_schedule_status') THEN
    ALTER TABLE bookings ADD INDEX idx_bookings_schedule_status (schedule_id, booking_status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='bookings' AND constraint_name='fk_bookings_passenger') THEN
    ALTER TABLE bookings ADD CONSTRAINT fk_bookings_passenger FOREIGN KEY(passenger_id) REFERENCES passengers(passenger_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='bookings' AND constraint_name='chk_booking_status') THEN
    ALTER TABLE bookings ADD CONSTRAINT chk_booking_status CHECK (booking_status IN ('PENDING_PAYMENT','CONFIRMED','CANCELLED'));
  END IF;
END$$
CALL seatswift_upgrade()$$
DROP PROCEDURE seatswift_upgrade$$
DELIMITER ;
CREATE TABLE IF NOT EXISTS payments (
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
CREATE TABLE IF NOT EXISTS payment_audit_log (
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

-- Seeder metadata prevents duplicate demo buses, departures and password resets.
CREATE TABLE IF NOT EXISTS demo_seed_state (
  seed_key VARCHAR(80) PRIMARY KEY,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS demo_bus_slots (
  route_id INT NOT NULL, slot INT NOT NULL, bus_id INT NOT NULL UNIQUE,
  PRIMARY KEY(route_id, slot),
  FOREIGN KEY(route_id) REFERENCES routes(route_id),
  FOREIGN KEY(bus_id) REFERENCES buses(bus_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS demo_schedules (
  schedule_id INT PRIMARY KEY,
  FOREIGN KEY(schedule_id) REFERENCES schedules(schedule_id)
) ENGINE=InnoDB;
INSERT IGNORE INTO demo_seed_state(seed_key) VALUES ('lock');
-- Rerunnable bus-owner extension. Apply to the existing SeatSwift database.
USE bus_seat_booking_system;
CREATE TABLE IF NOT EXISTS owner_users (
  owner_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  phone_number VARCHAR(40) NOT NULL,
  password VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS bus_owners (
  bus_id INT NOT NULL PRIMARY KEY,
  owner_id INT NOT NULL,
  CONSTRAINT fk_bus_owners_bus FOREIGN KEY(bus_id) REFERENCES buses(bus_id),
  CONSTRAINT fk_bus_owners_owner FOREIGN KEY(owner_id) REFERENCES owner_users(owner_id),
  INDEX idx_bus_owners_owner(owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- Rerunnable upgrade: all owners require an explicit admin approval.
-- Existing owners become PENDING on the first upgrade; reruns keep decisions.
USE bus_seat_booking_system;
DELIMITER $$
DROP PROCEDURE IF EXISTS seatswift_owner_approval_upgrade$$
CREATE PROCEDURE seatswift_owner_approval_upgrade()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='owner_users' AND column_name='approval_status') THEN
    ALTER TABLE owner_users ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='owner_users' AND column_name='reviewed_by') THEN
    ALTER TABLE owner_users ADD COLUMN reviewed_by INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='owner_users' AND column_name='reviewed_at') THEN
    ALTER TABLE owner_users ADD COLUMN reviewed_at TIMESTAMP NULL DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='owner_users' AND column_name='review_note') THEN
    ALTER TABLE owner_users ADD COLUMN review_note VARCHAR(500) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='owner_users' AND column_name='verification_details') THEN
    ALTER TABLE owner_users ADD COLUMN verification_details VARCHAR(1000) NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='owner_users' AND constraint_name='chk_owner_approval_status') THEN
    ALTER TABLE owner_users ADD CONSTRAINT chk_owner_approval_status CHECK (approval_status IN ('PENDING','APPROVED','REJECTED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='owner_users' AND constraint_name='fk_owner_reviewed_by') THEN
    ALTER TABLE owner_users ADD CONSTRAINT fk_owner_reviewed_by FOREIGN KEY(reviewed_by) REFERENCES admin_users(admin_id);
  END IF;
END$$
CALL seatswift_owner_approval_upgrade()$$
DROP PROCEDURE seatswift_owner_approval_upgrade$$
DELIMITER ;
CREATE TABLE IF NOT EXISTS owner_approval_audit (
  audit_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  admin_id INT NOT NULL,
  decision VARCHAR(20) NOT NULL,
  reason VARCHAR(500) NULL,
  reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_owner_approval_audit_owner FOREIGN KEY(owner_id) REFERENCES owner_users(owner_id),
  CONSTRAINT fk_owner_approval_audit_admin FOREIGN KEY(admin_id) REFERENCES admin_users(admin_id),
  CONSTRAINT chk_owner_approval_audit_decision CHECK (decision IN ('APPROVED','REJECTED')),
  INDEX idx_owner_approval_audit(owner_id,reviewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'SeatSwift schema ready. Bus owners require one-time admin approval.' AS result;
