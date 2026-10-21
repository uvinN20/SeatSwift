package com.bookingSeatApplication.service;

import com.bookingSeatApplication.dto.PassengerLoginDto;
import com.bookingSeatApplication.dto.PassengerRegisterDto;

public interface PassengerService {

    void registerPassenger(PassengerRegisterDto request);

    boolean loginPassenger(PassengerLoginDto request);
}