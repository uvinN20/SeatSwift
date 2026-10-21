package com.bookingSeatApplication.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ScheduleRequestDto {

    private int routeId;
    private int busId;
    private LocalDate travelDate;
    private LocalTime departureTime;
    private BigDecimal price;
}
