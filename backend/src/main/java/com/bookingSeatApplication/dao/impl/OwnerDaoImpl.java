package com.bookingSeatApplication.dao.impl;

import com.bookingSeatApplication.dao.OwnerDao;
import com.bookingSeatApplication.dto.OwnerDtos.*;
import com.bookingSeatApplication.exception.ConflictException;
import com.bookingSeatApplication.model.OwnerUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public class OwnerDaoImpl implements OwnerDao {
    private final JdbcTemplate db;
    public OwnerDaoImpl(JdbcTemplate db) { this.db = db; }
    private static final RowMapper<OwnerUser> USER = (r, n) -> new OwnerUser(r.getInt("owner_id"),
        r.getString("username"), r.getString("full_name"), r.getString("phone_number"),
        r.getString("password"), r.getBoolean("active"), r.getString("approval_status"));
    public OwnerUser findByUsername(String name) {
        var rows = db.query("SELECT * FROM owner_users WHERE username=?", USER, name);
        return rows.isEmpty() ? null : rows.get(0);
    }
    public OwnerUser findById(int id) {
        var rows = db.query("SELECT * FROM owner_users WHERE owner_id=?", USER, id);
        return rows.isEmpty() ? null : rows.get(0);
    }
    public List<Account> accounts() {
        return db.query("SELECT * FROM owner_users ORDER BY owner_id", (r,n) -> {
            int id = r.getInt("owner_id");
            var reviewedAt = r.getTimestamp("reviewed_at");
            return new Account(id,r.getString("username"),r.getString("full_name"),r.getString("phone_number"),
                r.getBoolean("active"),db.queryForList("SELECT bus_id FROM bus_owners WHERE owner_id=? ORDER BY bus_id",Integer.class,id),
                r.getString("approval_status"),r.getObject("reviewed_by",Integer.class),
                reviewedAt == null ? null : reviewedAt.toLocalDateTime(),r.getString("review_note"),r.getString("verification_details"));
        });
    }
    public int create(String username, String name, String phone, String password, boolean active) {
        db.update("INSERT INTO owner_users(username,full_name,phone_number,password,active,approval_status) VALUES (?,?,?,?,?,'PENDING')",
            username, name, phone, password, active);
        return findByUsername(username).ownerId();
    }
    public void update(int id, String name, String phone, boolean active, String password) {
        db.update("UPDATE owner_users SET full_name=?,phone_number=?,active=? WHERE owner_id=?", name, phone, active, id);
        if (password != null) db.update("UPDATE owner_users SET password=? WHERE owner_id=?", password, id);
    }
    public void review(int ownerId, int adminId, String decision, String reason) {
        if (db.update("UPDATE owner_users SET approval_status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,review_note=? WHERE owner_id=?",
                decision, adminId, reason, ownerId) == 0)
            throw new com.bookingSeatApplication.exception.NotFoundException("Owner account not found");
        db.update("INSERT INTO owner_approval_audit(owner_id,admin_id,decision,reason) VALUES (?,?,?,?)", ownerId,adminId,decision,reason);
    }
    public void setVerificationDetails(int ownerId, String details) {
        db.update("UPDATE owner_users SET verification_details=? WHERE owner_id=?",details,ownerId);
    }
    public void assignBuses(int ownerId, List<Integer> ids) {
        // Lock bus rows in a stable order. One bus can belong to one owner only.
        for (int busId : ids.stream().sorted().toList()) {
            if (db.queryForList("SELECT bus_id FROM buses WHERE bus_id=? FOR UPDATE", Integer.class, busId).isEmpty())
                throw new IllegalArgumentException("Bus #" + busId + " does not exist");
            var assigned = db.queryForList("SELECT owner_id FROM bus_owners WHERE bus_id=?", Integer.class, busId);
            if (!assigned.isEmpty() && assigned.get(0) != ownerId)
                throw new ConflictException("Bus #" + busId + " belongs to another owner. Unassign it there first.");
        }
        db.update("DELETE FROM bus_owners WHERE owner_id=?", ownerId);
        for (int busId : ids) db.update("INSERT INTO bus_owners(owner_id,bus_id) VALUES (?,?)", ownerId, busId);
    }
    public List<FleetBus> fleet(Integer ownerId) {
        String sql = "SELECT b.bus_id,b.route_id,r.source,r.destination,b.total_seats,o.owner_id,u.full_name " +
            "FROM buses b JOIN routes r ON r.route_id=b.route_id LEFT JOIN bus_owners o ON o.bus_id=b.bus_id " +
            "LEFT JOIN owner_users u ON u.owner_id=o.owner_id";
        RowMapper<FleetBus> mapper = (r,n) -> new FleetBus(r.getInt("bus_id"),r.getInt("route_id"),
            r.getString("source"),r.getString("destination"),r.getInt("total_seats"),
            r.getObject("owner_id", Integer.class),r.getString("full_name"));
        return ownerId == null ? db.query(sql + " ORDER BY b.bus_id", mapper) :
            db.query(sql + " WHERE o.owner_id=? ORDER BY b.bus_id", mapper, ownerId);
    }
    private static final String TRIPS = "SELECT s.*,r.source,r.destination," +
        "(SELECT COUNT(*) FROM seats st WHERE st.bus_id=s.bus_id) total_seats," +
        "(SELECT COUNT(*) FROM bookings b WHERE b.schedule_id=s.schedule_id AND b.booking_status<>'CANCELLED') booked_seats," +
        "(SELECT COUNT(*) FROM bookings b WHERE b.schedule_id=s.schedule_id AND b.booking_status='CONFIRMED') confirmed_seats," +
        "(SELECT COALESCE(SUM(b.amount),0) FROM bookings b WHERE b.schedule_id=s.schedule_id AND b.booking_status='CONFIRMED') confirmed_value " +
        "FROM schedules s JOIN routes r ON r.route_id=s.route_id JOIN bus_owners o ON o.bus_id=s.bus_id WHERE o.owner_id=?";
    private static final RowMapper<Trip> TRIP = (r,n) -> new Trip(r.getInt("schedule_id"),r.getInt("bus_id"),
        r.getString("source"),r.getString("destination"),r.getDate("travel_date").toLocalDate(),
        r.getTime("departure_time").toLocalTime(),r.getBigDecimal("price"),r.getInt("total_seats"),
        r.getInt("booked_seats"),r.getInt("confirmed_seats"),r.getBigDecimal("confirmed_value"));
    public List<Trip> trips(int ownerId, LocalDate date) {
        return db.query(TRIPS + " AND s.travel_date=? ORDER BY s.departure_time,s.bus_id", TRIP, ownerId, date);
    }
    public Trip trip(int ownerId, int scheduleId) {
        var rows = db.query(TRIPS + " AND s.schedule_id=?", TRIP, ownerId, scheduleId);
        return rows.isEmpty() ? null : rows.get(0);
    }
    public List<Reservation> reservations(int ownerId, int scheduleId) {
        return db.query("SELECT b.*,st.seat_number FROM bookings b JOIN schedules s ON s.schedule_id=b.schedule_id " +
            "JOIN bus_owners o ON o.bus_id=s.bus_id JOIN seats st ON st.seat_id=b.seat_id " +
            "WHERE o.owner_id=? AND s.schedule_id=? ORDER BY st.seat_id,b.booking_id", (r,n) ->
                new Reservation(r.getInt("booking_id"),r.getString("booking_reference"),r.getString("seat_number"),
                    r.getString("passenger_name"),r.getString("phone_number"),r.getString("booking_status"),r.getBigDecimal("amount")),
            ownerId, scheduleId);
    }
    public boolean ownsBus(int ownerId, int busId) {
        return db.queryForObject("SELECT COUNT(*) FROM bus_owners WHERE owner_id=? AND bus_id=?", Integer.class, ownerId, busId) > 0;
    }
    public void createTrip(int ownerId, NewTrip request) {
        var routes = db.queryForList("SELECT route_id FROM buses WHERE bus_id=? FOR UPDATE", Integer.class, request.busId());
        if (routes.isEmpty() || !ownsBus(ownerId, request.busId()))
            throw new com.bookingSeatApplication.exception.NotFoundException("Assigned bus not found");
        if (db.queryForObject("SELECT COUNT(*) FROM schedules WHERE bus_id=? AND travel_date=? AND departure_time=?", Integer.class,
                request.busId(), request.travelDate(), request.departureTime()) > 0)
            throw new ConflictException("This bus already has a departure at that date and time");
        db.update("INSERT INTO schedules(route_id,bus_id,travel_date,departure_time,price) VALUES (?,?,?,?,?)",
            routes.get(0),request.busId(),request.travelDate(),request.departureTime(),request.price());
    }
    public boolean hasBookingHistory(int scheduleId) {
        return db.queryForObject("SELECT COUNT(*) FROM bookings WHERE schedule_id=?", Integer.class, scheduleId) > 0;
    }
    public void updateTrip(int ownerId, int scheduleId, NewTrip request) {
        // Lock and scope the schedule before checking its history. A booking history
        // is immutable so passenger tickets keep their original trip and fare.
        var routes = db.queryForList("SELECT b.route_id FROM schedules s JOIN buses b ON b.bus_id=? " +
            "JOIN bus_owners o ON o.bus_id=s.bus_id AND o.owner_id=? WHERE s.schedule_id=? FOR UPDATE",
            Integer.class, request.busId(), ownerId, scheduleId);
        if (routes.isEmpty()) throw new com.bookingSeatApplication.exception.NotFoundException("Assigned trip or bus not found");
        if (hasBookingHistory(scheduleId))
            throw new ConflictException("This departure has booking history and cannot be changed. Contact an administrator for help.");
        if (!ownsBus(ownerId, request.busId()))
            throw new com.bookingSeatApplication.exception.NotFoundException("Assigned bus not found");
        if (db.queryForObject("SELECT COUNT(*) FROM schedules WHERE bus_id=? AND travel_date=? AND departure_time=? AND schedule_id<>?", Integer.class,
                request.busId(), request.travelDate(), request.departureTime(), scheduleId) > 0)
            throw new ConflictException("This bus already has a departure at that date and time");
        int changed = db.update("UPDATE schedules SET route_id=?,bus_id=?,travel_date=?,departure_time=?,price=? " +
            "WHERE schedule_id=? AND EXISTS (SELECT 1 FROM bus_owners o WHERE o.owner_id=? AND o.bus_id=schedules.bus_id) " +
            "AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.schedule_id=schedules.schedule_id)",
            routes.get(0), request.busId(), request.travelDate(), request.departureTime(), request.price(), scheduleId, ownerId);
        if (changed == 0) {
            if (hasBookingHistory(scheduleId)) throw new ConflictException("This departure has booking history and cannot be changed. Contact an administrator for help.");
            throw new com.bookingSeatApplication.exception.NotFoundException("Assigned trip not found");
        }
    }
    public void deleteTrip(int ownerId, int scheduleId) {
        // The database predicate protects against deleting a departure that gained
        // a booking after the page was loaded; booking rows remain audit records.
        int changed = db.update("DELETE FROM schedules WHERE schedule_id=? " +
            "AND EXISTS (SELECT 1 FROM bus_owners o WHERE o.owner_id=? AND o.bus_id=schedules.bus_id) " +
            "AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.schedule_id=schedules.schedule_id)", scheduleId, ownerId);
        if (changed == 0) {
            if (trip(ownerId, scheduleId) == null) throw new com.bookingSeatApplication.exception.NotFoundException("Assigned trip not found");
            throw new ConflictException("This departure has booking history and cannot be deleted. Contact an administrator for help.");
        }
    }
}
