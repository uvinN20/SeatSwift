package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.service.PaymentService;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;

/** Shared builder so every slip download carries the same hardening headers. */
final class PaymentResponses {

    private PaymentResponses() {}

    static ResponseEntity<Resource> slip(PaymentService.SlipFile slip) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(slip.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(slip.downloadName()).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noStore().cachePrivate())
                .body(slip.resource());
    }
}
