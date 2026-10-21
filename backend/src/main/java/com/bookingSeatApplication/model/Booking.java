package com.bookingSeatApplication.model;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class Booking {

    private int bookingId;
    private int scheduleId;
    private int seatId;
    private Integer passengerId;
    private String passengerName;
    private String phoneNumber;
    private String bookingReference;
    private BookingStatus bookingStatus;
    private BigDecimal amount;
}
