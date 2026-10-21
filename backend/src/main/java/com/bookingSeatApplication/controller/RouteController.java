package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.model.Route;
import com.bookingSeatApplication.service.RouteService;
import com.bookingSeatApplication.util.ResponseCodes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;



@RestController
@RequestMapping("/api/routes")
public class RouteController {

    @Autowired
    private RouteService routeService;


    // Get all available routes
    @GetMapping
    public ResponseEntity<ResponseDto> getAllRoutes(){

        ResponseDto response = new ResponseDto();

        try{

            // Call service layer to fetch routes
            List<Route> routes = routeService.getAllRoutes();

            // Set success response
            response.setStatus("Success");
            response.setReturnCode(ResponseCodes.SUCCESS);
            response.setDescription("Routes fetched successfully");
            response.setData(routes);

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            // Handle errors
            response.setStatus("Failed");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Error fetching routes");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

}
