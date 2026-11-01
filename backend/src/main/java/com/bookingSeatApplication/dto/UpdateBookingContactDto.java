package com.bookingSeatApplication.dto;

import lombok.Data;

/** Passenger-editable contact fields for an upcoming booking. */
@Data
public class UpdateBookingContactDto {
    private String passengerName;
    private String phoneNumber;
}
