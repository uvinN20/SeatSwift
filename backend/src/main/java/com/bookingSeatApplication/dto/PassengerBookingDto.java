package com.bookingSeatApplication.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** One row of the passenger's booking + payment history. paymentStatus is NOT_SUBMITTED when no slip exists yet. */
@Data
public class PassengerBookingDto {

    private int bookingId;
    private String bookingReference;
    private String bookingStatus;
    private BigDecimal amount;

    private int scheduleId;
    private int busId;
    private String routeSource;
    private String routeDestination;
    private LocalDate travelDate;
    private LocalTime departureTime;
    private String seatNumber;

    private String paymentStatus;
    private String paymentReference;
    private LocalDateTime slipUploadedAt;
    private String rejectionReason;
    private boolean canUploadSlip;
}
