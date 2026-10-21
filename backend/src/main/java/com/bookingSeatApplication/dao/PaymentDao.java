package com.bookingSeatApplication.dao;

import com.bookingSeatApplication.dto.PagedResultDto;
import com.bookingSeatApplication.dto.PaymentAuditDto;
import com.bookingSeatApplication.dto.PaymentDetailDto;
import com.bookingSeatApplication.model.Payment;

import java.time.LocalDate;
import java.util.List;

public interface PaymentDao {

    int insert(Payment payment);

    /** Replaces the slip of a REJECTED payment and returns it to PENDING_VERIFICATION. Rows changed. */
    int resubmit(Payment payment);

    Payment findById(int paymentId);

    Payment findByBookingId(int bookingId);

    /** Atomic PENDING_VERIFICATION -> VERIFIED. Rows changed (0 = not pending anymore). */
    int markVerified(int paymentId, int adminId);

    /** Atomic PENDING_VERIFICATION -> REJECTED. Rows changed (0 = not pending anymore). */
    int markRejected(int paymentId, int adminId, String reason);

    PaymentDetailDto findDetailById(int paymentId);

    PaymentDetailDto findDetailByBookingId(int bookingId);

    PagedResultDto<PaymentDetailDto> search(String status, String query, LocalDate travelDate,
                                            LocalDate uploadedFrom, LocalDate uploadedTo, int page, int size);

    void insertAudit(int paymentId, String action, String fromStatus, String toStatus,
                     String actorType, int actorId, String note);

    List<PaymentAuditDto> findAudit(int paymentId);
}
