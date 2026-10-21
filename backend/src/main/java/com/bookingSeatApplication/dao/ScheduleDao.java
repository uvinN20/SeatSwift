package com.bookingSeatApplication.dao;

import com.bookingSeatApplication.dto.ScheduleSearchResultDto;
import com.bookingSeatApplication.model.Schedule;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleDao {

    void addSchedule(Schedule schedule);

    List<Schedule> getAllSchedules();

    Schedule getScheduleById(int scheduleId);

    /** Priced trips for a route on a date, with live seat counts (cancelled bookings free their seat). */
    List<ScheduleSearchResultDto> search(String source, String destination, LocalDate travelDate);
}
