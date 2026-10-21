package com.bookingSeatApplication.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BusScheduleDto {

    private int routeId;
    private LocalDate travelDate;
    private LocalTime travelTime;
    private int totalSeats;
}
