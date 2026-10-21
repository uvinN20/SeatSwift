package com.bookingSeatApplication.dao.impl;

import com.bookingSeatApplication.dao.RouteDao;
import com.bookingSeatApplication.model.Route;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class RouteDaoImpl implements RouteDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Fetch All routes from database
    @Override
    public List<Route> getAllRoutes() {

        try{

            String sql = "SELECT * FROM routes";

            return jdbcTemplate.query(sql,(rs,rowNum) ->{
                Route route = new Route();
                route.setRouteId(rs.getInt("route_id"));
                route.setSource(rs.getString("source"));
                route.setDestination(rs.getString("destination"));
                return route;
            });

        }catch(Exception e){
            throw new RuntimeException("Database error while fetching routes",e);
        }

    }
}
