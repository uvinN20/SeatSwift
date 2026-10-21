package com.bookingSeatApplication.service;

import com.bookingSeatApplication.dto.PagedResultDto;
import com.bookingSeatApplication.dto.PaymentAuditDto;
import com.bookingSeatApplication.dto.PaymentDetailDto;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

public interface PaymentService {

    record SlipFile(Resource resource, String contentType, String downloadName) {}

    // ---- passenger ----
    PaymentDetailDto submitSlip(int passengerId, int bookingId, String transactionReference, MultipartFile file);

    PaymentDetailDto getForPassenger(int passengerId, int bookingId);

    SlipFile getSlipForPassenger(int passengerId, int bookingId);

    // ---- admin ----
    PagedResultDto<PaymentDetailDto> search(String status, String query, LocalDate travelDate,
                                            LocalDate uploadedFrom, LocalDate uploadedTo, int page, int size);

    PaymentDetailDto getForAdmin(int paymentId);

    SlipFile getSlipForAdmin(int paymentId);

    PaymentDetailDto approve(int adminId, int paymentId);

    PaymentDetailDto reject(int adminId, int paymentId, String reason);

    List<PaymentAuditDto> history(int paymentId);
}
