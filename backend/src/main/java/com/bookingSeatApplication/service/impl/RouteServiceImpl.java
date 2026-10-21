package com.bookingSeatApplication.service.impl;

import com.bookingSeatApplication.dao.RouteDao;
import com.bookingSeatApplication.model.Route;
import com.bookingSeatApplication.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RouteServiceImpl implements RouteService {

    @Autowired
    private  RouteDao routeDao;


    // Fetch all available routes
    @Override
    public List<Route> getAllRoutes() {
        try{

            List<Route> routes = routeDao.getAllRoutes();

            if(routes == null || routes.isEmpty()){
                throw new RuntimeException("No routes found");
            }

            return routes;

        } catch (Exception e) {
            throw new RuntimeException("Error occurred while fetching routes",e);
        }

    }
}
