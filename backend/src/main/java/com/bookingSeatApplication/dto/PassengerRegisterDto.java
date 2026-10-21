package com.bookingSeatApplication.dto;

import lombok.Data;

@Data
public class PassengerRegisterDto {

    private String passengerName;
    private String email;
    private String phoneNumber;
    private String password;

}