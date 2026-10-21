package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.BookingRequestDto;
import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.exception.ConflictException;
import com.bookingSeatApplication.exception.NotFoundException;
import com.bookingSeatApplication.service.BookingService;
import com.bookingSeatApplication.util.AuthPrincipal;
import com.bookingSeatApplication.util.ResponseCodes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // PASSENGER only (see SecurityConfig). The booking is owned by the authenticated passenger.
    @PostMapping
    public ResponseEntity<ResponseDto> bookSeat(@RequestBody BookingRequestDto request,
                                                @AuthenticationPrincipal AuthPrincipal principal){

        ResponseDto response = new ResponseDto();

        try{

            String bookingReference = bookingService.bookSeat(request, principal.id());

            response.setStatus("SUCCESS");
            response.setReturnCode(ResponseCodes.CREATED);
            response.setDescription("Booking created. Please upload your payment slip to confirm it.");
            response.setData(bookingReference);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        }
        catch (IllegalArgumentException e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.BAD_REQUEST);
            response.setDescription(e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);

        }
        catch (NotFoundException e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.NOT_FOUND);
            response.setDescription(e.getMessage());

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);

        }
        catch (ConflictException e){

            response.setStatus("FAILED");
            response.setReturnCode("409");
            response.setDescription(e.getMessage());

            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);

        }
        catch (Exception e){

            response.setStatus("FAILED");
            response.setReturnCode(ResponseCodes.ERROR);
            response.setDescription("Internal server error");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
