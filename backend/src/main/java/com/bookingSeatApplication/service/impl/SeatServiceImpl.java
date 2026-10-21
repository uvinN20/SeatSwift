package com.bookingSeatApplication.service.impl;

import com.bookingSeatApplication.dao.SeatDao;
import com.bookingSeatApplication.model.Seat;
import com.bookingSeatApplication.service.SeatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SeatServiceImpl implements SeatService {

    @Autowired
    private SeatDao seatDao;

    @Override
    public List<Seat> getSeatsByBus(int busId) {

        if (busId <= 0) {
            throw new IllegalArgumentException("Invalid bus ID");
        }

        List<Seat> seats = seatDao.getSeatsByBus(busId);

        if (seats == null || seats.isEmpty()) {
            throw new RuntimeException("No seats found for bus ID: " + busId);
        }

        return seats;
    }

    @Override
    public List<Seat> getSeatsForSchedule(int scheduleId) {

        if (scheduleId <= 0) {
            throw new IllegalArgumentException("Invalid schedule ID");
        }

        List<Seat> seats = seatDao.getSeatsForSchedule(scheduleId);

        if (seats == null || seats.isEmpty()) {
            throw new IllegalArgumentException("No seats found for schedule ID: " + scheduleId);
        }

        return seats;
    }
}
