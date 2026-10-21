package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.PaymentRejectRequestDto;
import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.service.PaymentService;
import com.bookingSeatApplication.util.ApiResponses;
import com.bookingSeatApplication.util.AuthPrincipal;
import com.bookingSeatApplication.util.ResponseCodes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/** ADMIN-only (SecurityConfig: /api/admin/**). The reviewing admin id always comes from the token. */
@RestController
@RequestMapping("/api/admin/payments")
public class AdminPaymentController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping
    public ResponseEntity<ResponseDto> search(
            @RequestParam(required = false) String status,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate travelDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate uploadedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate uploadedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponses.success(ResponseCodes.SUCCESS, "Payments fetched successfully",
                paymentService.search(status, query, travelDate, uploadedFrom, uploadedTo, page, size)));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<ResponseDto> get(@PathVariable int paymentId) {
        return ResponseEntity.ok(ApiResponses.success(ResponseCodes.SUCCESS, "Payment fetched successfully",
                paymentService.getForAdmin(paymentId)));
    }

    @GetMapping("/{paymentId}/slip")
    public ResponseEntity<Resource> slip(@PathVariable int paymentId) {
        return PaymentResponses.slip(paymentService.getSlipForAdmin(paymentId));
    }

    @PostMapping("/{paymentId}/approve")
    public ResponseEntity<ResponseDto> approve(@PathVariable int paymentId,
                                               @AuthenticationPrincipal AuthPrincipal admin) {
        return ResponseEntity.ok(ApiResponses.success(ResponseCodes.SUCCESS,
                "Payment verified and booking confirmed", paymentService.approve(admin.id(), paymentId)));
    }

    @PostMapping("/{paymentId}/reject")
    public ResponseEntity<ResponseDto> reject(@PathVariable int paymentId,
                                              @RequestBody PaymentRejectRequestDto body,
                                              @AuthenticationPrincipal AuthPrincipal admin) {
        return ResponseEntity.ok(ApiResponses.success(ResponseCodes.SUCCESS, "Payment rejected",
                paymentService.reject(admin.id(), paymentId, body == null ? null : body.getReason())));
    }

    @GetMapping("/{paymentId}/history")
    public ResponseEntity<ResponseDto> history(@PathVariable int paymentId) {
        return ResponseEntity.ok(ApiResponses.success(ResponseCodes.SUCCESS, "Payment history fetched successfully",
                paymentService.history(paymentId)));
    }
}
