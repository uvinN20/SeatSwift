package com.bookingSeatApplication.dto;

import lombok.Data;

// used to return booking details to the client
@Data
public class BookingResponseDto {

    private String bookingReference;
    private int busId;
    private int seatId;
    private String passengerName;
}
