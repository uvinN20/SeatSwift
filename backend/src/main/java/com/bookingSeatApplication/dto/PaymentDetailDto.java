package com.bookingSeatApplication.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** Joined view of a payment with its booking, trip and passenger. Never exposes slip file paths or password hashes. */
@Data
public class PaymentDetailDto {

    private int paymentId;
    private String paymentReference;
    private String paymentStatus;
    private BigDecimal amount;
    private String transactionReference;
    private String paymentMethod;
    private String slipContentType;
    private LocalDateTime uploadedAt;
    private String verifiedByUsername;
    private LocalDateTime verifiedAt;
    private String rejectionReason;
    private int resubmissionCount;
    /** Fraud signals for the reviewer: how many OTHER payments share this transaction reference / identical slip file. */
    private int transactionReferenceReuseCount;
    private int slipReuseCount;

    private int bookingId;
    private String bookingReference;
    private String bookingStatus;

    private int passengerId;
    private String passengerName;
    private String passengerEmail;
    private String passengerPhone;

    private int scheduleId;
    private int busId;
    private int routeId;
    private String routeSource;
    private String routeDestination;
    private LocalDate travelDate;
    private LocalTime departureTime;
    private String seatNumber;
}
