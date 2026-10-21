package com.bookingSeatApplication.service;

import com.bookingSeatApplication.model.Bus;

import java.util.List;

public interface BusService {

    List<Bus> getBusesByRoute(int routeId);
}
