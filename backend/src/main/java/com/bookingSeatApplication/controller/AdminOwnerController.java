package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dto.OwnerDtos.*;
import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.service.impl.OwnerService;
import com.bookingSeatApplication.util.ApiResponses;
import com.bookingSeatApplication.util.AuthPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/owners")
public class AdminOwnerController {
    private final OwnerService service;
    public AdminOwnerController(OwnerService service) { this.service=service; }
    @GetMapping public ResponseDto all() { return ApiResponses.success("200","Owner accounts",service.accounts()); }
    @GetMapping("/buses") public ResponseDto fleet() { return ApiResponses.success("200","Fleet assignments",service.fleet(null)); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ResponseDto create(@RequestBody AccountRequest request) {
        return ApiResponses.success("201","Owner account created; admin approval required",service.save(null,request));
    }
    @PutMapping("/{ownerId}") public ResponseDto update(@PathVariable int ownerId, @RequestBody AccountRequest request) {
        return ApiResponses.success("200","Owner account updated",service.save(ownerId,request));
    }
    @PostMapping("/{ownerId}/approval")
    public ResponseDto review(@AuthenticationPrincipal AuthPrincipal admin, @PathVariable int ownerId, @RequestBody ApprovalRequest request) {
        service.review(ownerId,admin.id(),request);
        return ApiResponses.success("200","Owner approval updated",null);
    }
}
