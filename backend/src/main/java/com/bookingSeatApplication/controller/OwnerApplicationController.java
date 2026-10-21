package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.OwnerDtos.OwnerApplication;
import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.service.impl.OwnerService;
import com.bookingSeatApplication.util.ApiResponses;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/owner-requests")
public class OwnerApplicationController {
    private final OwnerService service;
    public OwnerApplicationController(OwnerService service) { this.service=service; }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto apply(@RequestBody OwnerApplication application) {
        service.apply(application);
        return ApiResponses.success("201","Owner account request submitted. An administrator must verify and approve it before you can sign in.",null);
    }
}
