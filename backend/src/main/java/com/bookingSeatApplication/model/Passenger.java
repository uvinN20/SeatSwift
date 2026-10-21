package com.bookingSeatApplication.model;

import lombok.Data;

@Data
public class Passenger {

    private int passengerId;
    private String passengerName;
    private String email;
    private String phoneNumber;
    private String password;
}