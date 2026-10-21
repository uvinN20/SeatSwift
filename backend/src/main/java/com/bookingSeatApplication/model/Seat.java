package com.bookingSeatApplication.model;

import lombok.Data;

import java.io.Serializable;

@Data
public class Seat implements Serializable {

    private static final long serialVersionUID = 1L;

    private int seatId;
    private int busId;
    private String seatNumber;
    private Boolean booked;

}
