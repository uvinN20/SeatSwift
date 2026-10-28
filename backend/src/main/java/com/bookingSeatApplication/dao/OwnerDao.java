package com.bookingSeatApplication.dao;

import com.bookingSeatApplication.dto.OwnerDtos.*;
import com.bookingSeatApplication.model.OwnerUser;
import java.time.LocalDate;
import java.util.List;

public interface OwnerDao {
    OwnerUser findByUsername(String username);
    OwnerUser findById(int ownerId);
    List<Account> accounts();
    int create(String username, String fullName, String phoneNumber, String password, boolean active);
    void update(int ownerId, String fullName, String phoneNumber, boolean active, String password);
    void assignBuses(int ownerId, List<Integer> busIds);
    List<FleetBus> fleet(Integer ownerId);
    List<Trip> trips(int ownerId, LocalDate date);
    Trip trip(int ownerId, int scheduleId);
    List<Reservation> reservations(int ownerId, int scheduleId);
    boolean ownsBus(int ownerId, int busId);
    void createTrip(int ownerId, NewTrip request);
    void updateTrip(int ownerId, int scheduleId, NewTrip request);
    void deleteTrip(int ownerId, int scheduleId);
    boolean hasBookingHistory(int scheduleId);
    void review(int ownerId, int adminId, String decision, String reason);
    void setVerificationDetails(int ownerId, String details);
}
