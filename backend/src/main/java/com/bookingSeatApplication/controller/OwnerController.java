package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.OwnerDtos.*;
import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.service.impl.OwnerService;
import com.bookingSeatApplication.util.ApiResponses;
import com.bookingSeatApplication.util.AuthPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {
    private final OwnerService service;
    public OwnerController(OwnerService service) { this.service=service; }
    @GetMapping("/buses")
    public ResponseDto buses(@AuthenticationPrincipal AuthPrincipal user) {
        return ApiResponses.success("200","Your assigned buses",service.fleet(user.id()));
    }
    @GetMapping("/schedules")
    public ResponseDto trips(@AuthenticationPrincipal AuthPrincipal user,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponses.success("200","Your departures",service.trips(user.id(),date));
    }
    @GetMapping("/schedules/{scheduleId}")
    public ResponseDto detail(@AuthenticationPrincipal AuthPrincipal user, @PathVariable int scheduleId) {
        return ApiResponses.success("200","Seat map and bookings",service.detail(user.id(),scheduleId));
    }
    @PostMapping("/schedules")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ResponseDto create(@AuthenticationPrincipal AuthPrincipal user, @RequestBody NewTrip request) {
        service.createTrip(user.id(),request);
        return ApiResponses.success("201","Departure added",null);
    }
    @PutMapping("/schedules/{scheduleId}")
    public ResponseDto update(@AuthenticationPrincipal AuthPrincipal user, @PathVariable int scheduleId, @RequestBody NewTrip request) {
        service.updateTrip(user.id(),scheduleId,request);
        return ApiResponses.success("200","Departure updated",null);
    }
    @DeleteMapping("/schedules/{scheduleId}")
    public ResponseDto delete(@AuthenticationPrincipal AuthPrincipal user, @PathVariable int scheduleId) {
        service.deleteTrip(user.id(),scheduleId);
        return ApiResponses.success("200","Departure removed",null);
    }
}
