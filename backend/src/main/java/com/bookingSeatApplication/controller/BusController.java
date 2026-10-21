package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.model.Bus;
import com.bookingSeatApplication.service.BusService;
import com.bookingSeatApplication.util.ResponseCodes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/buses")
public class BusController {

    @Autowired
    private  BusService busService;


    // Get buses based on selected route
    @GetMapping("/{routeId}")
    public ResponseEntity<ResponseDto> getBusesByRoute(@PathVariable int routeId){

        ResponseDto response = new ResponseDto();

        try{
            // Fetch buses for the given route
            List<Bus> buses = busService.getBusesByRoute(routeId);

            response.setStatus("Success");
            response.setReturnCode(ResponseCodes.SUCCESS);
            response.setDescription("Buses fetched successfully");
            response.setData(buses);

            return ResponseEntity.ok(response);

        }catch (Exception e){

            response.setStatus("Failed");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Error fetching buses");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
