package com.bookingSeatApplication.service.impl;

import com.bookingSeatApplication.dao.BookingDao;
import com.bookingSeatApplication.dao.PaymentDao;
import com.bookingSeatApplication.dto.PagedResultDto;
import com.bookingSeatApplication.dto.PaymentAuditDto;
import com.bookingSeatApplication.dto.PaymentDetailDto;
import com.bookingSeatApplication.exception.ConflictException;
import com.bookingSeatApplication.exception.NotFoundException;
import com.bookingSeatApplication.model.Booking;
import com.bookingSeatApplication.model.BookingStatus;
import com.bookingSeatApplication.model.Payment;
import com.bookingSeatApplication.model.PaymentStatus;
import com.bookingSeatApplication.service.PaymentService;
import com.bookingSeatApplication.storage.PaymentSlipStorageService;
import com.bookingSeatApplication.storage.StoredSlip;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final int MIN_REJECTION_REASON = 5;
    private static final int MAX_REJECTION_REASON = 500;

    @Autowired
    private PaymentDao paymentDao;

    @Autowired
    private BookingDao bookingDao;

    @Autowired
    private PaymentSlipStorageService storage;

    // ------------------------------------------------------------------ passenger

    @Override
    @Transactional
    public PaymentDetailDto submitSlip(int passengerId, int bookingId, String transactionReference, MultipartFile file) {

        String txn = transactionReference == null ? "" : transactionReference.trim();
        if (txn.length() < 4 || txn.length() > 100) {
            throw new IllegalArgumentException("Transaction reference must be between 4 and 100 characters");
        }

        // Ownership check: a booking that is not yours looks exactly like one that does not exist.
        Booking booking = bookingDao.findById(bookingId);
        if (booking == null || booking.getPassengerId() == null || booking.getPassengerId() != passengerId) {
            throw new NotFoundException("Booking not found");
        }
        if (booking.getBookingStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new ConflictException("This booking is " + booking.getBookingStatus()
                    + " and cannot accept a payment slip");
        }

        Payment existing = paymentDao.findByBookingId(bookingId);
        if (existing != null && existing.getPaymentStatus() != PaymentStatus.REJECTED) {
            throw new ConflictException("A payment slip has already been submitted for this booking");
        }

        StoredSlip stored = storage.store(file); // validates type/size/content; throws IllegalArgumentException

        try {
            Payment p = new Payment();
            p.setTransactionReference(txn);
            p.setSlipStoredName(stored.storedName());
            p.setSlipOriginalName(stored.originalName());
            p.setSlipContentType(stored.contentType());
            p.setSlipSizeBytes(stored.sizeBytes());
            p.setSlipSha256(stored.sha256());

            int paymentId;
            if (existing == null) {
                p.setPaymentReference("PAY" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase());
                p.setBookingId(bookingId);
                p.setPassengerId(passengerId);
                p.setAmount(booking.getAmount());
                p.setPaymentMethod("BANK_TRANSFER");
                paymentId = paymentDao.insert(p);
                paymentDao.insertAudit(paymentId, "SUBMITTED", null, PaymentStatus.PENDING_VERIFICATION.name(),
                        "PASSENGER", passengerId, null);
            } else {
                p.setPaymentId(existing.getPaymentId());
                if (paymentDao.resubmit(p) == 0) {
                    throw new ConflictException("Payment is no longer open for resubmission");
                }
                paymentId = existing.getPaymentId();
                paymentDao.insertAudit(paymentId, "RESUBMITTED", PaymentStatus.REJECTED.name(),
                        PaymentStatus.PENDING_VERIFICATION.name(), "PASSENGER", passengerId, null);
                storage.deleteQuietly(existing.getSlipStoredName());
            }

            return paymentDao.findDetailById(paymentId);

        } catch (DuplicateKeyException e) {
            storage.deleteQuietly(stored.storedName());
            throw new ConflictException("A payment slip has already been submitted for this booking");
        } catch (RuntimeException e) {
            storage.deleteQuietly(stored.storedName()); // do not leave orphaned files behind
            throw e;
        }
    }

    @Override
    public PaymentDetailDto getForPassenger(int passengerId, int bookingId) {
        PaymentDetailDto d = paymentDao.findDetailByBookingId(bookingId);
        if (d == null || d.getPassengerId() != passengerId) {
            throw new NotFoundException("Payment not found for this booking");
        }
        return d;
    }

    @Override
    public SlipFile getSlipForPassenger(int passengerId, int bookingId) {
        Payment p = paymentDao.findByBookingId(bookingId);
        if (p == null || p.getPassengerId() != passengerId) {
            throw new NotFoundException("Payment slip not found");
        }
        return toSlipFile(p);
    }

    // ---------------------------------------------------------------------- admin

    @Override
    public PagedResultDto<PaymentDetailDto> search(String status, String query, LocalDate travelDate,
                                                   LocalDate uploadedFrom, LocalDate uploadedTo, int page, int size) {

        String normalizedStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                normalizedStatus = PaymentStatus.valueOf(status.trim().toUpperCase()).name();
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid payment status filter");
            }
        }
        if (page < 0) {
            throw new IllegalArgumentException("Page must be 0 or greater");
        }
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100");
        }
        if (uploadedFrom != null && uploadedTo != null && uploadedFrom.isAfter(uploadedTo)) {
            throw new IllegalArgumentException("'uploadedFrom' must not be after 'uploadedTo'");
        }

        return paymentDao.search(normalizedStatus, query, travelDate, uploadedFrom, uploadedTo, page, size);
    }

    @Override
    public PaymentDetailDto getForAdmin(int paymentId) {
        PaymentDetailDto d = paymentDao.findDetailById(paymentId);
        if (d == null) {
            throw new NotFoundException("Payment not found");
        }
        return d;
    }

    @Override
    public SlipFile getSlipForAdmin(int paymentId) {
        Payment p = paymentDao.findById(paymentId);
        if (p == null) {
            throw new NotFoundException("Payment not found");
        }
        return toSlipFile(p);
    }

    @Override
    @Transactional
    public PaymentDetailDto approve(int adminId, int paymentId) {

        if (paymentDao.findById(paymentId) == null) {
            throw new NotFoundException("Payment not found");
        }

        // Conditional UPDATEs make duplicate / racing approvals impossible: only one can change a row.
        if (paymentDao.markVerified(paymentId, adminId) == 0) {
            throw new ConflictException("Payment is not awaiting verification (already approved or rejected)");
        }

        Payment p = paymentDao.findById(paymentId);
        if (bookingDao.confirmIfPendingPayment(p.getBookingId()) == 0) {
            // throwing rolls back the payment update above, so a VERIFIED payment can never point at a non-confirmable booking
            throw new ConflictException("The booking is no longer awaiting payment (it may have been cancelled)");
        }

        paymentDao.insertAudit(paymentId, "APPROVED", PaymentStatus.PENDING_VERIFICATION.name(),
                PaymentStatus.VERIFIED.name(), "ADMIN", adminId, null);

        return paymentDao.findDetailById(paymentId);
    }

    @Override
    @Transactional
    public PaymentDetailDto reject(int adminId, int paymentId, String reason) {

        String r = reason == null ? "" : reason.trim();
        if (r.length() < MIN_REJECTION_REASON) {
            throw new IllegalArgumentException("A rejection reason of at least " + MIN_REJECTION_REASON + " characters is required");
        }
        if (r.length() > MAX_REJECTION_REASON) {
            throw new IllegalArgumentException("Rejection reason must be at most " + MAX_REJECTION_REASON + " characters");
        }

        if (paymentDao.findById(paymentId) == null) {
            throw new NotFoundException("Payment not found");
        }

        if (paymentDao.markRejected(paymentId, adminId, r) == 0) {
            throw new ConflictException("Payment is not awaiting verification (already approved or rejected)");
        }

        // booking intentionally stays PENDING_PAYMENT so the passenger can upload a corrected slip
        paymentDao.insertAudit(paymentId, "REJECTED", PaymentStatus.PENDING_VERIFICATION.name(),
                PaymentStatus.REJECTED.name(), "ADMIN", adminId, r);

        return paymentDao.findDetailById(paymentId);
    }

    @Override
    public List<PaymentAuditDto> history(int paymentId) {
        if (paymentDao.findById(paymentId) == null) {
            throw new NotFoundException("Payment not found");
        }
        return paymentDao.findAudit(paymentId);
    }

    // --------------------------------------------------------------------- helpers

    private SlipFile toSlipFile(Payment p) {
        String ext = PaymentSlipStorageService.extensionForContentType(p.getSlipContentType());
        return new SlipFile(storage.load(p.getSlipStoredName()), p.getSlipContentType(),
                "slip-" + p.getPaymentReference() + "." + ext);
    }
}
