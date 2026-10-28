package com.bookingSeatApplication.dto;

import com.bookingSeatApplication.model.Seat;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;

public final class OwnerDtos {
    private OwnerDtos() {}
    public record Account(int ownerId, String username, String fullName, String phoneNumber,
                          boolean active, List<Integer> busIds, String approvalStatus,
                          Integer reviewedBy, LocalDateTime reviewedAt, String reviewNote, String verificationDetails) {}
    public record ApprovalRequest(String decision, String reason, Boolean identityVerified) {}
    public record OwnerApplication(String username, String fullName, String phoneNumber, String password, String verificationDetails) {}
    public record AccountRequest(String username, String fullName, String phoneNumber, String password,
                                 Boolean active, List<Integer> busIds) {}
    public record FleetBus(int busId, int routeId, String source, String destination, int totalSeats,
                           Integer ownerId, String ownerName) {}
    public record Trip(int scheduleId, int busId, String source, String destination,
                       LocalDate travelDate, LocalTime departureTime, BigDecimal price,
                       int totalSeats, int bookedSeats, int confirmedSeats, BigDecimal confirmedValue,
                       boolean hasBookingHistory) {}
    public record Reservation(int bookingId, String bookingReference, String seatNumber,
                              String passengerName, String phoneNumber, String bookingStatus,
                              BigDecimal amount) {}
    public record TripDetail(Trip trip, List<Seat> seats, List<Reservation> reservations) {}
    public record NewTrip(int busId, LocalDate travelDate, LocalTime departureTime, BigDecimal price) {}
}
