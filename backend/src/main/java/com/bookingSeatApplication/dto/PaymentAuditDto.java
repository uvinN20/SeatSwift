package com.bookingSeatApplication.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentAuditDto {
    private long auditId;
    private String action;
    private String fromStatus;
    private String toStatus;
    private String actorType;
    private int actorId;
    private String note;
    private LocalDateTime createdAt;
}
