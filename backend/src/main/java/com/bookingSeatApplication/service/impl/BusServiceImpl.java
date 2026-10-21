package com.bookingSeatApplication.service.impl;

import com.bookingSeatApplication.dao.BusDao;
import com.bookingSeatApplication.model.Bus;
import com.bookingSeatApplication.service.BusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BusServiceImpl implements BusService {

    @Autowired
    private  BusDao busDao;


    // Fetch buses by route ID.
    @Override
    public List<Bus> getBusesByRoute(int routeId) {

        try{

            if(routeId <= 0){
                throw new RuntimeException("Invalid route ID");
            }

            List<Bus> buses = busDao.getBusesByRoute(routeId);

            if(buses == null || buses.isEmpty()){
                throw new RuntimeException("No buses found for this route.");
            }

            return buses;

        } catch (Exception e) {

            throw new RuntimeException("Error occurred while fetching buses",e);
        }

    }
}
