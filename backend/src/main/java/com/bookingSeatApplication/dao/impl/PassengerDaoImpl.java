package com.bookingSeatApplication.dao.impl;

import com.bookingSeatApplication.dao.PassengerDao;
import com.bookingSeatApplication.model.Passenger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PassengerDaoImpl implements PassengerDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String INSERT_PASSENGER =
            "INSERT INTO passengers(passenger_name,email,phone_number,password) VALUES (?,?,?,?)";

    private static final String FIND_BY_EMAIL =
            "SELECT * FROM passengers WHERE email = ?";


    @Override
    public void save(Passenger passenger) {

        try{

            jdbcTemplate.update(
                    INSERT_PASSENGER,
                    passenger.getPassengerName(),
                    passenger.getEmail(),
                    passenger.getPhoneNumber(),
                    passenger.getPassword()
            );

        } catch (Exception e) {
            throw new RuntimeException("Database error saving passenger", e);
        }
    }


    @Override
    public Passenger findByEmail(String email) {

        try{

            return jdbcTemplate.queryForObject(
                    FIND_BY_EMAIL,
                    (rs,rowNum)->{

                        Passenger passenger = new Passenger();

                        passenger.setPassengerId(rs.getInt("passenger_id"));
                        passenger.setPassengerName(rs.getString("passenger_name"));
                        passenger.setEmail(rs.getString("email"));
                        passenger.setPhoneNumber(rs.getString("phone_number"));
                        passenger.setPassword(rs.getString("password"));

                        return passenger;
                    },
                    email
            );

        } catch (Exception e) {
            return null;
        }
    }
}