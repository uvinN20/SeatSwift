package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.dto.ScheduleRequestDto;
import com.bookingSeatApplication.service.ScheduleService;
import com.bookingSeatApplication.util.ResponseCodes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private com.bookingSeatApplication.service.BookingWindow bookingWindow;

    @PostMapping("/add")
    public ResponseEntity<ResponseDto> addSchedule(@RequestBody ScheduleRequestDto request){

        ResponseDto response = new ResponseDto();

        try{

            scheduleService.addSchedule(request);

            response.setStatus("SUCCESS");
            response.setReturnCode(ResponseCodes.CREATED);
            response.setDescription("Schedule created successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        }
        catch (IllegalArgumentException e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription(e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);

        }
        catch (Exception e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Internal server error");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<ResponseDto> getSchedules(){

        ResponseDto response = new ResponseDto();

        try{

            response.setStatus("SUCCESS");
            response.setReturnCode(ResponseCodes.SUCCESS);
            var cutoff = bookingWindow.earliestDeparture();
            response.setData(scheduleService.getAllSchedules().stream()
                .filter(s -> s.getPrice() != null && s.getPrice().signum() > 0)
                .filter(s -> !java.time.LocalDateTime.of(s.getTravelDate(), s.getDepartureTime()).isBefore(cutoff))
                .toList());

            return ResponseEntity.ok(response);

        } catch(Exception e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Error fetching schedules");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }


    // Public trip search: GET /api/schedules/search?source=Colombo&destination=Kandy&date=2026-11-02
    @GetMapping("/search")
    public ResponseEntity<ResponseDto> search(@RequestParam String source,
                                              @RequestParam String destination,
                                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date){

        ResponseDto response = new ResponseDto();

        try{

            response.setStatus("SUCCESS");
            response.setReturnCode(ResponseCodes.SUCCESS);
            response.setDescription("Trips fetched successfully");
            response.setData(scheduleService.search(source, destination, date));

            return ResponseEntity.ok(response);

        }
        catch (IllegalArgumentException e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.BAD_REQUEST);
            response.setDescription(e.getMessage());

            return ResponseEntity.badRequest().body(response);

        }
        catch (Exception e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Error searching trips");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
