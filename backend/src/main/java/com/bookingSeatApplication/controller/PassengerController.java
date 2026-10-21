package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.PassengerLoginDto;
import com.bookingSeatApplication.dto.PassengerRegisterDto;
import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.service.PassengerService;
import com.bookingSeatApplication.util.JwtUtil;
import com.bookingSeatApplication.util.ResponseCodes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/passengers")
public class PassengerController {

    @Autowired
    private PassengerService passengerService;

    @Autowired
    private JwtUtil jwtUtil;


    @PostMapping("/register")
    public ResponseEntity<ResponseDto> registerPassenger(
            @RequestBody PassengerRegisterDto request){

        ResponseDto response = new ResponseDto();

        try{

            passengerService.registerPassenger(request);

            response.setStatus("SUCCESS");
            response.setReturnCode(ResponseCodes.CREATED);
            response.setDescription("Passenger registered successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch(Exception e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Registration failed");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }


    @PostMapping("/login")
    public ResponseEntity<ResponseDto> loginPassenger(
            @RequestBody PassengerLoginDto request){

        ResponseDto response = new ResponseDto();

        try{

            boolean isValid = passengerService.loginPassenger(request);

            if(isValid){

                String token = jwtUtil.generateToken(request.getEmail(), "PASSENGER");

                response.setStatus("SUCCESS");
                response.setReturnCode(ResponseCodes.SUCCESS);
                response.setDescription("Login successful");
                response.setData(token);

                return ResponseEntity.ok(response);
            }

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.UNAUTHORIZED);
            response.setDescription("Invalid credentials");

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);

        } catch(Exception e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Internal server error");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}