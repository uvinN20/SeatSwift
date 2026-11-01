package com.bookingSeatApplication.service;

import com.bookingSeatApplication.dto.BookingRequestDto;
import com.bookingSeatApplication.dto.PassengerBookingDto;
import com.bookingSeatApplication.dto.UpdateBookingContactDto;
import com.bookingSeatApplication.model.Booking;

import java.util.List;

public interface BookingService {

    /** Creates a PENDING_PAYMENT booking owned by the authenticated passenger. Returns the booking reference. */
    String bookSeat(BookingRequestDto request, int passengerId);

    void cancelBooking(int bookingId, int passengerId);

    void updatePassengerDetails(int bookingId, int passengerId, UpdateBookingContactDto request);

    List<Booking> getAllBookings();

    List<PassengerBookingDto> getPassengerBookings(int passengerId);
}
