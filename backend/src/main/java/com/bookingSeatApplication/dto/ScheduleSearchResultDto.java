package com.bookingSeatApplication.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/** One bookable trip returned by the public search. Contains only data the system really has. */
@Data
public class ScheduleSearchResultDto {

    private int scheduleId;
    private int routeId;
    private String source;
    private String destination;
    private int busId;
    private LocalDate travelDate;
    private LocalTime departureTime;
    private BigDecimal price;
    private int totalSeats;
    private int availableSeats;
}
