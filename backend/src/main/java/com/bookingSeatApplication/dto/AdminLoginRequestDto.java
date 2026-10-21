package com.bookingSeatApplication.dto;

import lombok.Data;

// used for admin login requests.
@Data
public class AdminLoginRequestDto {

    private String username;
    private String password;
}
