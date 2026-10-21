package com.bookingSeatApplication.dao;

import com.bookingSeatApplication.model.Passenger;

public interface PassengerDao {

    void save(Passenger passenger);

    Passenger findByEmail(String email);
}