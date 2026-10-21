package com.bookingSeatApplication.model;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class Bus {

    private int busId;
    private int routeId;
    private LocalDate travelDate;
    private LocalTime travelTime;
    private int totalSeats;
}
