package com.bookingSeatApplication.service;

import com.bookingSeatApplication.dto.ScheduleRequestDto;
import com.bookingSeatApplication.dto.ScheduleSearchResultDto;
import com.bookingSeatApplication.model.Schedule;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleService {

    void addSchedule(ScheduleRequestDto request);

    List<Schedule> getAllSchedules();

    Schedule  getScheduleById(int scheduleId);

    List<ScheduleSearchResultDto> search(String source, String destination, LocalDate travelDate);

}
