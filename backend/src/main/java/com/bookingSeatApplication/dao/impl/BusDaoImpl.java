package com.bookingSeatApplication.dao.impl;

import com.bookingSeatApplication.dao.BusDao;
import com.bookingSeatApplication.model.Bus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class BusDaoImpl implements BusDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Fetch buses by route ID
    @Override
    public List<Bus> getBusesByRoute(int routeId) {

        try{

            String sql = "SELECT * FROM buses WHERE route_id = ?" ;

            return jdbcTemplate.query(sql,(rs, rowNum) -> {
                Bus bus = new Bus();
                bus.setBusId(rs.getInt("bus_id"));
                bus.setRouteId(rs.getInt("route_id"));
                bus.setTravelDate(rs.getDate("travel_date").toLocalDate());
                bus.setTravelTime(rs.getTime("travel_time").toLocalTime());
                bus.setTotalSeats(rs.getInt("total_seats"));
                return bus;
                } , routeId);

        } catch (Exception e) {
            throw new RuntimeException("Database error while fetching buses",e);
        }

    }
}
