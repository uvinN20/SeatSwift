package com.bookingSeatApplication.service.impl;

import com.bookingSeatApplication.dao.ScheduleDao;
import com.bookingSeatApplication.dto.ScheduleRequestDto;
import com.bookingSeatApplication.dto.ScheduleSearchResultDto;
import com.bookingSeatApplication.model.Schedule;
import com.bookingSeatApplication.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import com.bookingSeatApplication.service.BookingWindow;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ScheduleServiceImpl implements ScheduleService {

    @Autowired
    private ScheduleDao scheduleDao;

    @Autowired
    private BookingWindow bookingWindow;

    @Override
    public void addSchedule(ScheduleRequestDto request) {

        if(request == null){
            throw new IllegalArgumentException("Invalid schedule request");
        }

        if(request.getBusId() <= 0){
            throw new IllegalArgumentException("Invalid Bus ID");
        }

        if(request.getRouteId() <= 0){
            throw new IllegalArgumentException("Invalid Route ID");
        }

        if(request.getTravelDate() == null || request.getTravelDate().isBefore(bookingWindow.today())){
            throw new IllegalArgumentException("Travel date must be today or future");
        }

        if(request.getDepartureTime() == null){
            throw new IllegalArgumentException("Departure time required");
        }

        if(request.getPrice() == null || request.getPrice().signum() <= 0){
            throw new IllegalArgumentException("Ticket price must be greater than zero");
        }

        bookingWindow.requireBookable(request.getTravelDate(), request.getDepartureTime());

        Schedule schedule = new Schedule();

        schedule.setBusId(request.getBusId());
        schedule.setRouteId(request.getRouteId());
        schedule.setTravelDate(request.getTravelDate());
        schedule.setDepartureTime(request.getDepartureTime());
        schedule.setPrice(request.getPrice());

        scheduleDao.addSchedule(schedule);
    }

    @Override
    public List<Schedule> getAllSchedules() {
        return scheduleDao.getAllSchedules();
    }

    @Override
    public Schedule getScheduleById(int scheduleId) {

        if(scheduleId <= 0){
            throw new IllegalArgumentException("Invalid schedule ID");
        }

        return scheduleDao.getScheduleById(scheduleId);
    }


    @Override
    public List<ScheduleSearchResultDto> search(String source, String destination, LocalDate travelDate) {

        if (source == null || source.isBlank() || destination == null || destination.isBlank()) {
            throw new IllegalArgumentException("Origin and destination are required");
        }
        if (source.trim().equalsIgnoreCase(destination.trim())) {
            throw new IllegalArgumentException("Origin and destination must be different");
        }
        if (travelDate == null) {
            throw new IllegalArgumentException("Travel date is required");
        }
        if (travelDate.isBefore(bookingWindow.today())) {
            throw new IllegalArgumentException("Travel date must be today or later");
        }

        LocalDateTime cutoff = bookingWindow.earliestDeparture();
        // Capture the cutoff once so all rows share the same boundary.
        return scheduleDao.search(source.trim(), destination.trim(), travelDate).stream()
                .filter(r -> !LocalDateTime.of(r.getTravelDate(), r.getDepartureTime()).isBefore(cutoff))
                .toList();
    }
}
