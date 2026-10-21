package com.bookingSeatApplication.controller;

import com.bookingSeatApplication.dao.AdminUserDao;
import com.bookingSeatApplication.dao.OwnerDao;
import com.bookingSeatApplication.dao.PassengerDao;
import com.bookingSeatApplication.dto.AdminLoginRequestDto;
import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.util.ApiResponses;
import com.bookingSeatApplication.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class SharedLoginController {
    private final AdminUserDao admins;
    private final PassengerDao passengers;
    private final OwnerDao owners;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;
    public SharedLoginController(AdminUserDao admins, PassengerDao passengers, OwnerDao owners, PasswordEncoder encoder, JwtUtil jwt) {
        this.admins=admins; this.passengers=passengers; this.owners=owners; this.encoder=encoder; this.jwt=jwt;
    }
    @PostMapping("/login")
    public ResponseEntity<ResponseDto> login(@RequestBody AdminLoginRequestDto request) {
        if (request == null || request.getUsername() == null || request.getUsername().isBlank() || request.getPassword() == null || request.getPassword().isEmpty())
            throw new IllegalArgumentException("Email or username and password are required");
        String identity=request.getUsername().trim(), hash=null, role=null, subject=null, approvalStatus=null;
        if (identity.contains("@")) {
            var p=passengers.findByEmail(identity);
            if (p != null) { hash=p.getPassword(); role="PASSENGER"; subject=p.getEmail(); }
        } else {
            var a=admins.findByUsername(identity);
            if (a != null) { hash=a.getPassword(); role="ADMIN"; subject=a.getUsername(); }
            else {
                var o=owners.findByUsername(identity);
                if (o != null && o.active()) { hash=o.password(); role="BUS_OWNER"; subject=o.username(); approvalStatus=o.approvalStatus(); }
            }
        }
        if (hash == null || !encoder.matches(request.getPassword(), hash))
            return ResponseEntity.status(401).body(ApiResponses.failure("401","Invalid email or username and password"));
        if ("BUS_OWNER".equals(role) && !"APPROVED".equals(approvalStatus))
            return ResponseEntity.status(403).body(ApiResponses.failure("403", "PENDING".equals(approvalStatus)
                ? "Your bus owner account is awaiting admin approval. Please contact the administrator."
                : "Your bus owner access has not been approved. Please contact the administrator."));
        return ResponseEntity.ok(ApiResponses.success("200","Signed in", Map.of("token",jwt.generateToken(subject,role),"role",role)));
    }
}
