package com.bookingSeatApplication.dao;

import com.bookingSeatApplication.dto.PassengerBookingDto;
import com.bookingSeatApplication.model.Booking;

import java.util.List;

public interface BookingDao {

    /** True when a non-cancelled booking already holds this seat on this schedule. */
    boolean isSeatAlreadyBooked(int scheduleId, int seatId);

    /** True when the seat physically belongs to the bus running this schedule. */
    boolean isSeatOnScheduleBus(int scheduleId, int seatId);

    int saveBooking(Booking booking);

    Booking findById(int bookingId);

    List<Booking> getAllBookings();

    List<PassengerBookingDto> findPassengerBookings(int passengerId);

    void updateBookingReference(int bookingId, String bookingReference);

    /** Atomic PENDING_PAYMENT -> CONFIRMED. Returns rows changed (0 when the booking was not pending). */
    int confirmIfPendingPayment(int bookingId);
}
