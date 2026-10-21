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
