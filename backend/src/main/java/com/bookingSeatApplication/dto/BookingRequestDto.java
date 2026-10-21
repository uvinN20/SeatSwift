package com.bookingSeatApplication.dto;

import lombok.Data;

// used when a passenger submits a booking request.
@Data
public class BookingRequestDto {

    private int scheduleId;
    private int seatId;
    private String passengerName;
    private String phoneNumber;

}
