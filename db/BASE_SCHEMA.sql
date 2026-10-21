-- Fresh-install base schema for SeatSwift (MySQL 8.0+).
-- Run this once before migration/V1__payments_and_booking_status.sql.
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
