-- Manual rollback for V1 (destroys payment data created after V1; export first if needed).
DROP TABLE IF EXISTS payment_audit_log;
DROP TABLE IF EXISTS payments;
ALTER TABLE bookings DROP INDEX uq_bookings_active_seat, DROP COLUMN active_seat_id;
ALTER TABLE bookings DROP FOREIGN KEY fk_bookings_passenger;
ALTER TABLE bookings DROP CHECK chk_booking_status;
ALTER TABLE bookings DROP INDEX idx_bookings_passenger, DROP INDEX idx_bookings_schedule_status, DROP INDEX uq_bookings_reference;
ALTER TABLE bookings DROP COLUMN passenger_id, DROP COLUMN booking_status, DROP COLUMN amount, DROP COLUMN created_at, DROP COLUMN updated_at;
ALTER TABLE schedules DROP COLUMN price;
