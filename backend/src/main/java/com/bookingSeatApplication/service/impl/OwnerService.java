package com.bookingSeatApplication.service.impl;

import com.bookingSeatApplication.dao.AdminUserDao;
import com.bookingSeatApplication.dao.OwnerDao;
import com.bookingSeatApplication.dao.SeatDao;
import com.bookingSeatApplication.dto.OwnerDtos.*;
import com.bookingSeatApplication.exception.ConflictException;
import com.bookingSeatApplication.exception.NotFoundException;
import com.bookingSeatApplication.service.BookingWindow;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@Service
public class OwnerService {
    private final OwnerDao owners;
    private final AdminUserDao admins;
    private final SeatDao seats;
    private final PasswordEncoder encoder;
    private final BookingWindow window;
    public OwnerService(OwnerDao owners, AdminUserDao admins, SeatDao seats, PasswordEncoder encoder, BookingWindow window) {
        this.owners=owners; this.admins=admins; this.seats=seats; this.encoder=encoder; this.window=window;
    }
    public List<Account> accounts() { return owners.accounts(); }
    @Transactional
    public void apply(OwnerApplication application) {
        if (application == null) throw new IllegalArgumentException("Owner account request required");
        String details=required(application.verificationDetails(),"Business and bus ownership verification details",1000);
        int id=save(null,new AccountRequest(application.username(),application.fullName(),application.phoneNumber(),application.password(),true,List.of()));
        owners.setVerificationDetails(id,details);
    }
    @Transactional
    public void review(int ownerId, int adminId, ApprovalRequest request) {
        if (request == null || !("APPROVED".equals(request.decision()) || "REJECTED".equals(request.decision())))
            throw new IllegalArgumentException("Choose APPROVED or REJECTED");
        String reason = request.reason() == null ? "" : request.reason().trim();
        if (reason.length() > 500 || reason.isEmpty())
            throw new IllegalArgumentException("Record a verification note or rejection reason (maximum 500 characters)");
        if ("APPROVED".equals(request.decision()) && !Boolean.TRUE.equals(request.identityVerified()))
            throw new IllegalArgumentException("Confirm that you have verified this owner's identity and bus ownership before approving");
        owners.review(ownerId,adminId,request.decision(),reason.isEmpty() ? null : reason);
    }
    public List<FleetBus> fleet(Integer ownerId) { return owners.fleet(ownerId); }
    @Transactional
    public int save(Integer ownerId, AccountRequest request) {
        if (request == null) throw new IllegalArgumentException("Account details required");
        String name = required(request.fullName(), "Owner name", 150);
        String phone = required(request.phoneNumber(), "Phone number", 40);
        List<Integer> ids = request.busIds() == null ? List.of() : request.busIds();
        if (ids.size() > 500 || ids.stream().anyMatch(i -> i == null || i <= 0) || ids.stream().distinct().count() != ids.size())
            throw new IllegalArgumentException("Choose unique, valid bus IDs (up to 500)");
        String hash = null;
        if (ownerId == null || (request.password() != null && !request.password().isEmpty())) {
            String password = request.password();
            if (password == null || password.length() < 8 || password.getBytes(StandardCharsets.UTF_8).length > 72)
                throw new IllegalArgumentException("Password must be at least 8 characters and at most 72 UTF-8 bytes");
            hash = encoder.encode(password);
        }
        try {
            if (ownerId == null) {
                String username = required(request.username(), "Username", 60);
                if (!username.matches("[A-Za-z0-9._-]{3,60}"))
                    throw new IllegalArgumentException("Username must be 3–60 letters, digits, dots, underscores or hyphens");
                if (admins.findByUsername(username) != null || owners.findByUsername(username) != null)
                    throw new ConflictException("This username is already in use");
                ownerId = owners.create(username, name, phone, hash, !Boolean.FALSE.equals(request.active()));
            } else {
                if (owners.findById(ownerId) == null) throw new NotFoundException("Owner account not found");
                owners.update(ownerId, name, phone, !Boolean.FALSE.equals(request.active()), hash);
            }
            owners.assignBuses(ownerId, ids);
            return ownerId;
        } catch (DuplicateKeyException e) {
            throw new ConflictException("Username or bus assignment already in use. Refresh and try again.");
        }
    }
    private static String required(String value, String label, int max) {
        if (value == null || value.isBlank() || value.trim().length() > max)
            throw new IllegalArgumentException(label + " is required (maximum " + max + " characters)");
        return value.trim();
    }
    public List<Trip> trips(int ownerId, LocalDate date) {
        if (date == null) throw new IllegalArgumentException("Choose a travel date");
        return owners.trips(ownerId, date);
    }
    @Transactional(readOnly=true)
    public TripDetail detail(int ownerId, int scheduleId) {
        Trip trip = owners.trip(ownerId, scheduleId);
        if (trip == null) throw new NotFoundException("Assigned trip not found");
        return new TripDetail(trip, seats.getSeatsForSchedule(scheduleId), owners.reservations(ownerId, scheduleId));
    }
    @Transactional
    public void createTrip(int ownerId, NewTrip request) {
        if (request == null || request.busId() <= 0) throw new IllegalArgumentException("Choose an assigned bus");
        if (request.travelDate() == null || request.departureTime() == null)
            throw new IllegalArgumentException("Travel date and departure time are required");
        if (request.price() == null || request.price().signum() <= 0 || request.price().compareTo(new BigDecimal("99999999.99")) > 0 || request.price().stripTrailingZeros().scale() > 2)
            throw new IllegalArgumentException("Enter a positive ticket fare with at most two decimal places");
        window.requireBookable(request.travelDate(), request.departureTime());
        owners.createTrip(ownerId, request);
    }
}
