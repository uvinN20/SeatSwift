package com.bookingSeatApplication.service;

import com.bookingSeatApplication.dao.BookingDao;
import com.bookingSeatApplication.dao.PaymentDao;
import com.bookingSeatApplication.dto.PaymentDetailDto;
import com.bookingSeatApplication.exception.ConflictException;
import com.bookingSeatApplication.exception.NotFoundException;
import com.bookingSeatApplication.model.Booking;
import com.bookingSeatApplication.model.BookingStatus;
import com.bookingSeatApplication.model.Payment;
import com.bookingSeatApplication.model.PaymentStatus;
import com.bookingSeatApplication.service.impl.PaymentServiceImpl;
import com.bookingSeatApplication.storage.PaymentSlipStorageService;
import com.bookingSeatApplication.storage.StoredSlip;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock PaymentDao paymentDao;
    @Mock BookingDao bookingDao;
    @Mock PaymentSlipStorageService storage;
    @InjectMocks PaymentServiceImpl service;

    private static final MockMultipartFile FILE =
            new MockMultipartFile("file", "s.jpg", "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});

    private Booking booking(int id, int passengerId, BookingStatus status) {
        Booking b = new Booking();
        b.setBookingId(id);
        b.setPassengerId(passengerId);
        b.setBookingStatus(status);
        b.setAmount(new BigDecimal("1500.00"));
        return b;
    }

    private Payment payment(int id, PaymentStatus status) {
        Payment p = new Payment();
        p.setPaymentId(id);
        p.setBookingId(1);
        p.setPassengerId(10);
        p.setPaymentStatus(status);
        return p;
    }

    @Test
    void passengerCannotUploadForSomeoneElsesBooking() {
        when(bookingDao.findById(1)).thenReturn(booking(1, 10, BookingStatus.PENDING_PAYMENT));
        assertThrows(NotFoundException.class, () -> service.submitSlip(20, 1, "TXN-12345", FILE));
        verifyNoInteractions(storage);
    }

    @Test
    void uploadOnConfirmedOrCancelledBookingIsRejected() {
        when(bookingDao.findById(1)).thenReturn(booking(1, 10, BookingStatus.CONFIRMED));
        assertThrows(ConflictException.class, () -> service.submitSlip(10, 1, "TXN-12345", FILE));
    }

    @Test
    void secondUploadWhilePendingIsRejected() {
        when(bookingDao.findById(1)).thenReturn(booking(1, 10, BookingStatus.PENDING_PAYMENT));
        when(paymentDao.findByBookingId(1)).thenReturn(payment(5, PaymentStatus.PENDING_VERIFICATION));
        assertThrows(ConflictException.class, () -> service.submitSlip(10, 1, "TXN-12345", FILE));
    }

    @Test
    void validUploadCreatesPendingPaymentWithBookingAmount() {
        when(bookingDao.findById(1)).thenReturn(booking(1, 10, BookingStatus.PENDING_PAYMENT));
        when(paymentDao.findByBookingId(1)).thenReturn(null);
        when(storage.store(any())).thenReturn(new StoredSlip("u.jpg", "s.jpg", "image/jpeg", 3, "a".repeat(64)));
        when(paymentDao.insert(any())).thenReturn(7);
        when(paymentDao.findDetailById(7)).thenReturn(new PaymentDetailDto());

        service.submitSlip(10, 1, "TXN-12345", FILE);

        verify(paymentDao).insert(argThat(p -> p.getAmount().compareTo(new BigDecimal("1500.00")) == 0
                && p.getPassengerId() == 10));
        verify(paymentDao).insertAudit(eq(7), eq("SUBMITTED"), isNull(), eq("PENDING_VERIFICATION"), eq("PASSENGER"), eq(10), isNull());
    }

    @Test
    void approveConfirmsBookingAndRecordsAudit() {
        Payment p = payment(5, PaymentStatus.VERIFIED);
        when(paymentDao.findById(5)).thenReturn(p);
        when(paymentDao.markVerified(5, 9)).thenReturn(1);
        when(bookingDao.confirmIfPendingPayment(1)).thenReturn(1);
        when(paymentDao.findDetailById(5)).thenReturn(new PaymentDetailDto());

        service.approve(9, 5);

        verify(paymentDao).insertAudit(eq(5), eq("APPROVED"), anyString(), eq("VERIFIED"), eq("ADMIN"), eq(9), isNull());
    }

    @Test
    void duplicateApprovalOrRejectionIsConflict() {
        when(paymentDao.findById(5)).thenReturn(payment(5, PaymentStatus.VERIFIED));
        when(paymentDao.markVerified(5, 9)).thenReturn(0);
        when(paymentDao.markRejected(eq(5), eq(9), anyString())).thenReturn(0);
        assertThrows(ConflictException.class, () -> service.approve(9, 5));
        assertThrows(ConflictException.class, () -> service.reject(9, 5, "Amount does not match"));
        verify(bookingDao, never()).confirmIfPendingPayment(anyInt());
    }

    @Test
    void rejectRequiresReason() {
        assertThrows(IllegalArgumentException.class, () -> service.reject(9, 5, "  "));
        verifyNoInteractions(paymentDao);
    }

    @Test
    void approveFailsWhenBookingNoLongerPending() {
        when(paymentDao.findById(5)).thenReturn(payment(5, PaymentStatus.VERIFIED));
        when(paymentDao.markVerified(5, 9)).thenReturn(1);
        when(bookingDao.confirmIfPendingPayment(1)).thenReturn(0);
        assertThrows(ConflictException.class, () -> service.approve(9, 5)); // @Transactional rolls back the payment update
    }
}
