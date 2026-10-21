package com.bookingSeatApplication.model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class Schedule {

    private int scheduleId;
    private int routeId;
    private int busId;
    private LocalDate travelDate;
    private LocalTime departureTime;
    private BigDecimal price;
}
