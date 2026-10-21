package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.model.Seat;
import com.bookingSeatApplication.service.SeatService;
import com.bookingSeatApplication.util.ResponseCodes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seats")
public class SeatController {

    @Autowired
    private SeatService seatService;

    @GetMapping("/{busId}")
    public ResponseEntity<ResponseDto> getSeatsByBus(@PathVariable int busId) {

        ResponseDto response = new ResponseDto();

        try {

            List<Seat> seats = seatService.getSeatsByBus(busId);

            response.setStatus("SUCCESS");
            response.setReturnCode(ResponseCodes.SUCCESS);
            response.setDescription("Seat layout fetched successfully");
            response.setData(seats);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription(e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);

        } catch (Exception e) {

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Unable to fetch seat layout");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Seat map for one trip: Booked reflects bookings for THIS schedule only
    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<ResponseDto> getSeatsBySchedule(@PathVariable int scheduleId) {

        ResponseDto response = new ResponseDto();

        try {

            List<Seat> seats = seatService.getSeatsForSchedule(scheduleId);

            response.setStatus("SUCCESS");
            response.setReturnCode(ResponseCodes.SUCCESS);
            response.setDescription("Schedule seat availability fetched successfully");
            response.setData(seats);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.BAD_REQUEST);
            response.setDescription(e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);

        } catch (Exception e) {

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Unable to fetch seat availability");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
