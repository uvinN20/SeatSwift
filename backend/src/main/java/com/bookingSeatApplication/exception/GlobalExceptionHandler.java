package com.bookingSeatApplication.exception;

import com.bookingSeatApplication.dto.ResponseDto;
import com.bookingSeatApplication.util.ApiResponses;
import com.bookingSeatApplication.util.ResponseCodes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResponseDto> badRequest(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponses.failure(ResponseCodes.BAD_REQUEST, e.getMessage()));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ResponseDto> notFound(NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponses.failure(ResponseCodes.NOT_FOUND, e.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ResponseDto> forbidden(ForbiddenException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponses.failure(ResponseCodes.FORBIDDEN, e.getMessage()));
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ResponseDto> conflict(ConflictException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponses.failure("409", e.getMessage()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ResponseDto> tooLarge(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(413)
                .body(ApiResponses.failure("413", "Uploaded file is too large (maximum 5 MB)"));
    }

    @ExceptionHandler({MissingServletRequestPartException.class, MultipartException.class})
    public ResponseEntity<ResponseDto> badMultipart(Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponses.failure(ResponseCodes.BAD_REQUEST, "Invalid upload request: a 'file' part is required"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseDto> unexpected(Exception e) {
        log.error("Unhandled exception", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponses.failure(ResponseCodes.ERROR, "Internal server error"));
    }
}
