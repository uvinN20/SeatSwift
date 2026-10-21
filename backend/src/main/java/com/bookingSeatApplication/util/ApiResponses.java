package com.bookingSeatApplication.util;

import com.bookingSeatApplication.dto.ResponseDto;

/** Builds responses in the application's existing ResponseDto envelope. */
public final class ApiResponses {

    private ApiResponses() {}

    public static ResponseDto success(String returnCode, String description, Object data) {
        ResponseDto r = new ResponseDto();
        r.setStatus("SUCCESS");
        r.setReturnCode(returnCode);
        r.setDescription(description);
        r.setData(data);
        return r;
    }

    public static ResponseDto failure(String returnCode, String description) {
        ResponseDto r = new ResponseDto();
        r.setStatus("FAILED");
        r.setReturnCode(returnCode);
        r.setDescription(description);
        return r;
    }
}
