package com.bookingSeatApplication.dto;

import lombok.Data;

// used for all API responses.
// Field names are lower-camel-case on purpose: under Spring Boot 4 (Jackson 3) a capitalised field such as
// "Data" is serialised as "Data", but the frontend contract is {status, returnCode, description, data}.
@Data
public class ResponseDto {
    private String status;
    private String returnCode;
    private String description;
    private Object data;

}
