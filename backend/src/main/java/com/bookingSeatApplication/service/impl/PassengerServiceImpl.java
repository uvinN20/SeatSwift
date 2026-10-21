package com.bookingSeatApplication.service.impl;

import com.bookingSeatApplication.dao.PassengerDao;
import com.bookingSeatApplication.dto.PassengerLoginDto;
import com.bookingSeatApplication.dto.PassengerRegisterDto;
import com.bookingSeatApplication.model.Passenger;
import com.bookingSeatApplication.service.PassengerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PassengerServiceImpl implements PassengerService {

    @Autowired
    private PassengerDao passengerDao;

    @Autowired
    private PasswordEncoder passwordEncoder;


    @Override
    public void registerPassenger(PassengerRegisterDto request) {

        try{

            if(request.getEmail() == null || request.getEmail().isEmpty()){
                throw new IllegalArgumentException("Email required");
            }

            Passenger passenger = new Passenger();

            passenger.setPassengerName(request.getPassengerName());
            passenger.setEmail(request.getEmail());
            passenger.setPhoneNumber(request.getPhoneNumber());
            passenger.setPassword(
                    passwordEncoder.encode(request.getPassword())
            );

            passengerDao.save(passenger);

        } catch (Exception e) {
            throw new RuntimeException("Error registering passenger", e);
        }
    }


    @Override
    public boolean loginPassenger(PassengerLoginDto request) {

        try{

            Passenger passenger = passengerDao.findByEmail(request.getEmail());

            if(passenger == null){
                return false;
            }

            return passwordEncoder.matches(
                    request.getPassword(),
                    passenger.getPassword()
            );

        } catch (Exception e) {
            throw new RuntimeException("Passenger login error", e);
        }
    }
}