package com.bookingSeatApplication.dao.impl;

import com.bookingSeatApplication.dao.ScheduleDao;
import com.bookingSeatApplication.dto.ScheduleSearchResultDto;
import com.bookingSeatApplication.exception.NotFoundException;
import com.bookingSeatApplication.model.Schedule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public class ScheduleDaoImpl implements ScheduleDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String INSERT_SCHEDULE =
            "INSERT INTO schedules(route_id, bus_id, travel_date, departure_time, price) VALUES (?,?,?,?,?)";

    private static final String GET_ALL_SCHEDULES =
            "SELECT * FROM schedules ORDER BY schedule_id DESC";

    private static final String GET_SCHEDULE_BY_ID =
            "SELECT * FROM schedules WHERE schedule_id = ?";

    private static final RowMapper<Schedule> MAPPER = (rs, rowNum) -> {
        Schedule schedule = new Schedule();
        schedule.setScheduleId(rs.getInt("schedule_id"));
        schedule.setRouteId(rs.getInt("route_id"));
        schedule.setBusId(rs.getInt("bus_id"));
        schedule.setTravelDate(rs.getDate("travel_date").toLocalDate());
        schedule.setDepartureTime(rs.getTime("departure_time").toLocalTime());
        schedule.setPrice(rs.getBigDecimal("price"));
        return schedule;
    };

    @Override
    public void addSchedule(Schedule schedule) {
        jdbcTemplate.update(
                INSERT_SCHEDULE,
                schedule.getRouteId(),
                schedule.getBusId(),
                schedule.getTravelDate(),
                schedule.getDepartureTime(),
                schedule.getPrice()
        );
    }

    @Override
    public List<Schedule> getAllSchedules() {
        return jdbcTemplate.query(GET_ALL_SCHEDULES, MAPPER);
    }

    @Override
    public Schedule getScheduleById(int scheduleId) {
        List<Schedule> result = jdbcTemplate.query(GET_SCHEDULE_BY_ID, MAPPER, scheduleId);
        if (result.isEmpty()) {
            throw new NotFoundException("Schedule not found");
        }
        return result.get(0);
    }

    private static final String SEARCH =
            "SELECT s.schedule_id, s.route_id, r.source, r.destination, s.bus_id, s.travel_date, s.departure_time, s.price, " +
            "(SELECT COUNT(*) FROM seats st WHERE st.bus_id = s.bus_id) AS total_seats, " +
            "(SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.schedule_id AND b.booking_status <> 'CANCELLED') AS booked_seats " +
            "FROM schedules s JOIN routes r ON r.route_id = s.route_id " +
            "WHERE r.source = ? AND r.destination = ? AND s.travel_date = ? AND s.price > 0 " +
            "ORDER BY s.departure_time";

    @Override
    public List<ScheduleSearchResultDto> search(String source, String destination, LocalDate travelDate) {
        return jdbcTemplate.query(SEARCH, (rs, rowNum) -> {
            ScheduleSearchResultDto d = new ScheduleSearchResultDto();
            d.setScheduleId(rs.getInt("schedule_id"));
            d.setRouteId(rs.getInt("route_id"));
            d.setSource(rs.getString("source"));
            d.setDestination(rs.getString("destination"));
            d.setBusId(rs.getInt("bus_id"));
            d.setTravelDate(rs.getDate("travel_date").toLocalDate());
            d.setDepartureTime(rs.getTime("departure_time").toLocalTime());
            d.setPrice(rs.getBigDecimal("price"));
            int total = rs.getInt("total_seats");
            d.setTotalSeats(total);
            d.setAvailableSeats(Math.max(0, total - rs.getInt("booked_seats")));
            return d;
        }, source, destination, java.sql.Date.valueOf(travelDate));
    }
}
