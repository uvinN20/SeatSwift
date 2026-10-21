package com.bookingSeatApplication.model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class Payment {

    private int paymentId;
    private String paymentReference;
    private int bookingId;
    private int passengerId;
    private BigDecimal amount;
    private String transactionReference;
    private String paymentMethod;
    private String slipStoredName;
    private String slipOriginalName;
    private String slipContentType;
    private long slipSizeBytes;
    private String slipSha256;
    private PaymentStatus paymentStatus;
    private LocalDateTime uploadedAt;
    private Integer verifiedBy;
    private LocalDateTime verifiedAt;
    private String rejectionReason;
    private int resubmissionCount;
}
