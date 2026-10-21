package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.service.BookingService;
import com.bookingSeatApplication.service.PaymentService;
import com.bookingSeatApplication.util.ApiResponses;
import com.bookingSeatApplication.util.AuthPrincipal;
import com.bookingSeatApplication.util.ResponseCodes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** PASSENGER-only (SecurityConfig). Every method scopes by the authenticated passenger's id from the token. */
@RestController
@RequestMapping("/api/passenger")
public class PassengerPaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private BookingService bookingService;

    @GetMapping("/bookings")
    public ResponseEntity<ResponseDto> myBookings(@AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(ApiResponses.success(ResponseCodes.SUCCESS, "Bookings fetched successfully",
                bookingService.getPassengerBookings(me.id())));
    }

    @GetMapping("/bookings/{bookingId}/payment")
    public ResponseEntity<ResponseDto> myPayment(@PathVariable int bookingId,
                                                 @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(ApiResponses.success(ResponseCodes.SUCCESS, "Payment fetched successfully",
                paymentService.getForPassenger(me.id(), bookingId)));
    }

    @PostMapping(value = "/bookings/{bookingId}/payment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDto> uploadSlip(@PathVariable int bookingId,
                                                  @RequestParam("transactionReference") String transactionReference,
                                                  @RequestParam("file") MultipartFile file,
                                                  @AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponses.success(ResponseCodes.CREATED,
                "Payment slip submitted. It will be confirmed once an administrator verifies it.",
                paymentService.submitSlip(me.id(), bookingId, transactionReference, file)));
    }

    @GetMapping("/bookings/{bookingId}/payment/slip")
    public ResponseEntity<Resource> mySlip(@PathVariable int bookingId,
                                           @AuthenticationPrincipal AuthPrincipal me) {
        return PaymentResponses.slip(paymentService.getSlipForPassenger(me.id(), bookingId));
    }
}
