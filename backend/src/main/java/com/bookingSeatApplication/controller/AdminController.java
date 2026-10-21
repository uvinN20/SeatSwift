package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.AdminLoginRequestDto;
import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.model.Booking;
import com.bookingSeatApplication.service.AdminUserService;
import com.bookingSeatApplication.service.BookingService;
import com.bookingSeatApplication.util.JwtUtil;
import com.bookingSeatApplication.util.ResponseCodes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private PasswordEncoder passwordEncoder;


    @PostMapping("/login")
    public ResponseEntity<ResponseDto> login(@RequestBody AdminLoginRequestDto request){

        ResponseDto response = new ResponseDto();



        try{

            boolean isValid = adminUserService.login(
                    request.getUsername(),
                    request.getPassword()
            );

            if(isValid){

                String token = jwtUtil.generateToken(request.getUsername(), "ADMIN");

                response.setStatus("SUCCESS");
                response.setReturnCode(ResponseCodes.SUCCESS);
                response.setDescription("Login Successful");
                response.setData(token);

                return ResponseEntity.ok(response);
            }

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.UNAUTHORIZED);
            response.setDescription("Invalid username or password");

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);

        }
        catch (IllegalArgumentException e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.BAD_REQUEST);
            response.setDescription(e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
        catch(Exception e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Internal server error");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }


    @GetMapping("/bookings")
    public ResponseEntity<ResponseDto> getAllBookings(){

        ResponseDto response = new ResponseDto();

        try{

            List<Booking> bookings = bookingService.getAllBookings();

            response.setStatus("SUCCESS");
            response.setReturnCode(ResponseCodes.SUCCESS);
            response.setDescription("Bookings fetched successfully");
            response.setData(bookings);

            return ResponseEntity.ok(response);

        }
        catch(Exception e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Error fetching bookings");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}