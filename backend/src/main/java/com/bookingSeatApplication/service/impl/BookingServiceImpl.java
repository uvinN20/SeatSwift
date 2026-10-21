package com.bookingSeatApplication.service.impl;

import com.bookingSeatApplication.dao.BookingDao;
import com.bookingSeatApplication.dao.ScheduleDao;
import com.bookingSeatApplication.dto.BookingRequestDto;
import com.bookingSeatApplication.dto.PassengerBookingDto;
import com.bookingSeatApplication.exception.ConflictException;
import com.bookingSeatApplication.model.Booking;
import com.bookingSeatApplication.model.BookingStatus;
import com.bookingSeatApplication.model.Schedule;
import com.bookingSeatApplication.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import com.bookingSeatApplication.service.BookingWindow;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookingServiceImpl implements BookingService {

    @Autowired
    private BookingDao bookingDao;

    @Autowired
    private ScheduleDao scheduleDao;

    @Autowired
    private BookingWindow bookingWindow;

    @Override
    @Transactional
    public String bookSeat(BookingRequestDto request, int passengerId) {

        if (request == null) {
            throw new IllegalArgumentException("Invalid booking request");
        }

        if (request.getScheduleId() <= 0) {
            throw new IllegalArgumentException("Invalid schedule ID");
        }

        if (request.getSeatId() <= 0) {
            throw new IllegalArgumentException("Invalid seat ID");
        }

        if (request.getPassengerName() == null || request.getPassengerName().isBlank()) {
            throw new IllegalArgumentException("Passenger name required");
        }

        if (request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) {
            throw new IllegalArgumentException("Phone number required");
        }

        // throws NotFoundException when the schedule does not exist
        Schedule schedule = scheduleDao.getScheduleById(request.getScheduleId());

        bookingWindow.requireBookable(schedule.getTravelDate(), schedule.getDepartureTime());

        if (schedule.getPrice() == null || schedule.getPrice().signum() <= 0) {
            throw new IllegalArgumentException("Fare is not configured for this schedule yet");
        }

        if (!bookingDao.isSeatOnScheduleBus(request.getScheduleId(), request.getSeatId())) {
            throw new IllegalArgumentException("Seat does not belong to the bus assigned to this schedule");
        }

        if (bookingDao.isSeatAlreadyBooked(request.getScheduleId(), request.getSeatId())) {
            throw new ConflictException("Seat already booked for this schedule");
        }

        Booking booking = new Booking();
        booking.setScheduleId(request.getScheduleId());
        booking.setSeatId(request.getSeatId());
        booking.setPassengerId(passengerId); // from the verified token, never from the request body
        booking.setPassengerName(request.getPassengerName().trim());
        booking.setPhoneNumber(request.getPhoneNumber().trim());
        booking.setBookingStatus(BookingStatus.PENDING_PAYMENT);
        booking.setAmount(schedule.getPrice());

        int bookingId;
        try {
            bookingId = bookingDao.saveBooking(booking);
        } catch (DuplicateKeyException e) {
            // two requests raced past the check above; the unique index decided the winner
            throw new ConflictException("Seat already booked for this schedule");
        }

        // Generate reference like REF0001
        String bookingReference = "REF" + String.format("%04d", bookingId);
        bookingDao.updateBookingReference(bookingId, bookingReference);

        return bookingReference;
    }

    @Override
    public List<Booking> getAllBookings() {
        return bookingDao.getAllBookings();
    }

    @Override
    public List<PassengerBookingDto> getPassengerBookings(int passengerId) {
        return bookingDao.findPassengerBookings(passengerId);
    }
}
