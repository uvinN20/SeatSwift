package com.bookingSeatApplication.dao.impl;

import com.bookingSeatApplication.dao.SeatDao;
import com.bookingSeatApplication.model.Seat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SeatDaoImpl implements SeatDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String GET_SEATS_BY_BUS =
            "SELECT seat_id, bus_id, seat_number FROM seats WHERE bus_id = ?";

    @Override
    public List<Seat> getSeatsByBus(int busId) {

        try {

            return jdbcTemplate.query(GET_SEATS_BY_BUS, (rs, rowNum) -> {

                Seat seat = new Seat();
                seat.setSeatId(rs.getInt("seat_id"));
                seat.setBusId(rs.getInt("bus_id"));
                seat.setSeatNumber(rs.getString("seat_number"));
                // A physical bus layout has no departure-specific occupancy.
                // Use getSeatsForSchedule for real availability.
                seat.setBooked(false);

                return seat;

            }, busId);

        } catch (Exception e) {
            throw new RuntimeException("Database error while fetching seats for busId: " + busId, e);
        }
    }

    private static final String GET_SEATS_FOR_SCHEDULE =
            "SELECT st.seat_id, st.bus_id, st.seat_number, (b.booking_id IS NOT NULL) AS booked " +
            "FROM schedules s " +
            "JOIN seats st ON st.bus_id = s.bus_id " +
            "LEFT JOIN bookings b ON b.schedule_id = s.schedule_id AND b.seat_id = st.seat_id " +
            "AND b.booking_status <> 'CANCELLED' " +
            "WHERE s.schedule_id = ? ORDER BY st.seat_id";

    @Override
    public List<Seat> getSeatsForSchedule(int scheduleId) {

        try {

            return jdbcTemplate.query(GET_SEATS_FOR_SCHEDULE, (rs, rowNum) -> {

                Seat seat = new Seat();
                seat.setSeatId(rs.getInt("seat_id"));
                seat.setBusId(rs.getInt("bus_id"));
                seat.setSeatNumber(rs.getString("seat_number"));
                seat.setBooked(rs.getBoolean("booked"));
                return seat;

            }, scheduleId);

        } catch (Exception e) {
            throw new RuntimeException("Database error while fetching seats for scheduleId: " + scheduleId, e);
        }
    }
}
