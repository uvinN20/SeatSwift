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
