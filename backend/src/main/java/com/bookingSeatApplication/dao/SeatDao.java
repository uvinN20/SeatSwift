package com.bookingSeatApplication.dao;

import com.bookingSeatApplication.model.Seat;

import java.util.List;

public interface SeatDao {

    List<Seat> getSeatsByBus(int busId);

    /** Seats of the schedule's bus; Booked is true when a non-cancelled booking holds the seat for THIS schedule. */
    List<Seat> getSeatsForSchedule(int scheduleId);
}
