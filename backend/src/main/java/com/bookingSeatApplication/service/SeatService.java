package com.bookingSeatApplication.service;

import com.bookingSeatApplication.model.Seat;

import java.util.List;

public interface SeatService {

    List<Seat> getSeatsByBus(int busId);

    List<Seat> getSeatsForSchedule(int scheduleId);
}
