package com.bookingSeatApplication.dao;

import com.bookingSeatApplication.model.Bus;

import java.util.List;

public interface BusDao {

    List<Bus> getBusesByRoute(int routeId);
}
