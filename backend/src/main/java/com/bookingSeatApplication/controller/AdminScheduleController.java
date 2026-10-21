package com.bookingSeatApplication.controller;
import com.bookingSeatApplication.dao.ScheduleDao;
import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.util.ResponseCodes;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/admin/schedules")
public class AdminScheduleController {
    private final ScheduleDao schedules;
    public AdminScheduleController(ScheduleDao schedules) { this.schedules = schedules; }
    @GetMapping public ResponseDto all() {
        ResponseDto response = new ResponseDto();
        response.setStatus("SUCCESS"); response.setReturnCode(ResponseCodes.SUCCESS);
        response.setData(schedules.getAllSchedules()); return response;
    }
}
