package com.bookingSeatApplication.dao.impl;

import com.bookingSeatApplication.dao.BookingDao;
import com.bookingSeatApplication.dto.PassengerBookingDto;
import com.bookingSeatApplication.model.Booking;
import com.bookingSeatApplication.model.BookingStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.List;

@Repository
public class BookingDaoImpl implements BookingDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final RowMapper<Booking> BOOKING_MAPPER = (rs, rowNum) -> {
        Booking booking = new Booking();
        booking.setBookingId(rs.getInt("booking_id"));
        booking.setScheduleId(rs.getInt("schedule_id"));
        booking.setSeatId(rs.getInt("seat_id"));
        int passengerId = rs.getInt("passenger_id");
        booking.setPassengerId(rs.wasNull() ? null : passengerId);
        booking.setPassengerName(rs.getString("passenger_name"));
        booking.setPhoneNumber(rs.getString("phone_number"));
        booking.setBookingReference(rs.getString("booking_reference"));
        booking.setBookingStatus(BookingStatus.valueOf(rs.getString("booking_status")));
        booking.setAmount(rs.getBigDecimal("amount"));
        return booking;
    };

    @Override
    public boolean isSeatAlreadyBooked(int scheduleId, int seatId) {

        try {

            String sql = "SELECT COUNT(*) FROM bookings " +
                    "WHERE schedule_id = ? AND seat_id = ? AND booking_status <> 'CANCELLED'";

            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, scheduleId, seatId);

            return count != null && count > 0;

        } catch (Exception e) {
            throw new RuntimeException("Database error checking seat booking", e);
        }
    }

    @Override
    public boolean isSeatOnScheduleBus(int scheduleId, int seatId) {

        String sql = "SELECT COUNT(*) FROM seats st JOIN schedules s ON s.bus_id = st.bus_id " +
                "WHERE st.seat_id = ? AND s.schedule_id = ?";

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, seatId, scheduleId);
        return count != null && count > 0;
    }

    //save booking into database
    @Override
    public int saveBooking(Booking booking) {

        String sql = "INSERT INTO bookings " +
                "(schedule_id, seat_id, passenger_id, passenger_name, phone_number, booking_status, amount) " +
                "VALUES (?,?,?,?,?,?,?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {

            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"booking_id"});

            ps.setInt(1, booking.getScheduleId());
            ps.setInt(2, booking.getSeatId());
            if (booking.getPassengerId() == null) {
                ps.setNull(3, Types.INTEGER);
            } else {
                ps.setInt(3, booking.getPassengerId());
            }
            ps.setString(4, booking.getPassengerName());
            ps.setString(5, booking.getPhoneNumber());
            ps.setString(6, booking.getBookingStatus().name());
            ps.setBigDecimal(7, booking.getAmount());

            return ps;

        }, keyHolder);

        // DuplicateKeyException (double booking race) is deliberately NOT wrapped: the service translates it.
        return keyHolder.getKey().intValue();
    }

    @Override
    public int cancelOwnedUpcoming(int bookingId, int passengerId, java.time.LocalDateTime now) {
        // One conditional write protects ownership, departure time and concurrent state changes.
        // The generated active_seat_id becomes NULL, releasing only this departure's seat.
        return jdbcTemplate.update("UPDATE bookings SET booking_status='CANCELLED' " +
                "WHERE booking_id=? AND passenger_id=? AND booking_status IN ('PENDING_PAYMENT','CONFIRMED') " +
                "AND schedule_id IN (SELECT schedule_id FROM schedules WHERE travel_date > ? " +
                "OR (travel_date = ? AND departure_time > ?))",
                bookingId, passengerId, now.toLocalDate(), now.toLocalDate(), now.toLocalTime());
    }

    @Override
    public Booking findById(int bookingId) {
        List<Booking> rows = jdbcTemplate.query(
                "SELECT * FROM bookings WHERE booking_id = ?", BOOKING_MAPPER, bookingId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Override
    public List<Booking> getAllBookings() {

        try {
            return jdbcTemplate.query("SELECT * FROM bookings ORDER BY booking_id DESC", BOOKING_MAPPER);
        } catch (Exception e) {
            throw new RuntimeException("Database error  fetching bookings", e);
        }
    }

    private static final String PASSENGER_BOOKINGS =
            "SELECT b.booking_id, b.booking_reference, b.booking_status, b.amount, " +
            "s.schedule_id, s.bus_id, r.source, r.destination, s.travel_date, s.departure_time, st.seat_number, " +
            "p.payment_status, p.payment_reference, p.uploaded_at, p.rejection_reason " +
            "FROM bookings b " +
            "JOIN schedules s ON s.schedule_id = b.schedule_id " +
            "JOIN routes r ON r.route_id = s.route_id " +
            "JOIN seats st ON st.seat_id = b.seat_id " +
            "LEFT JOIN payments p ON p.booking_id = b.booking_id " +
            "WHERE b.passenger_id = ? ORDER BY b.booking_id DESC";

    @Override
    public List<PassengerBookingDto> findPassengerBookings(int passengerId) {

        return jdbcTemplate.query(PASSENGER_BOOKINGS, (rs, rowNum) -> {

            PassengerBookingDto dto = new PassengerBookingDto();
            dto.setBookingId(rs.getInt("booking_id"));
            dto.setBookingReference(rs.getString("booking_reference"));
            dto.setBookingStatus(rs.getString("booking_status"));
            dto.setAmount(rs.getBigDecimal("amount"));
            dto.setScheduleId(rs.getInt("schedule_id"));
            dto.setBusId(rs.getInt("bus_id"));
            dto.setRouteSource(rs.getString("source"));
            dto.setRouteDestination(rs.getString("destination"));
            dto.setTravelDate(rs.getDate("travel_date").toLocalDate());
            dto.setDepartureTime(rs.getTime("departure_time").toLocalTime());
            dto.setSeatNumber(rs.getString("seat_number"));

            String paymentStatus = rs.getString("payment_status");
            dto.setPaymentStatus(paymentStatus == null ? "NOT_SUBMITTED" : paymentStatus);
            dto.setPaymentReference(rs.getString("payment_reference"));
            Timestamp uploaded = rs.getTimestamp("uploaded_at");
            dto.setSlipUploadedAt(uploaded == null ? null : uploaded.toLocalDateTime());
            dto.setRejectionReason(rs.getString("rejection_reason"));

            // Upload allowed only while the booking is unpaid AND no slip is awaiting/accepted
            dto.setCanUploadSlip("PENDING_PAYMENT".equals(dto.getBookingStatus())
                    && (paymentStatus == null || "REJECTED".equals(paymentStatus)));

            return dto;

        }, passengerId);
    }

    @Override
    public void updateBookingReference(int bookingId, String bookingReference) {

        try {
            jdbcTemplate.update("UPDATE bookings SET booking_reference = ? WHERE booking_id = ?",
                    bookingReference, bookingId);
        } catch (Exception e) {
            throw new RuntimeException("Database error updating booking reference", e);
        }
    }

    @Override
    public int confirmIfPendingPayment(int bookingId) {
        return jdbcTemplate.update(
                "UPDATE bookings SET booking_status = 'CONFIRMED' " +
                "WHERE booking_id = ? AND booking_status = 'PENDING_PAYMENT'", bookingId);
    }
}
