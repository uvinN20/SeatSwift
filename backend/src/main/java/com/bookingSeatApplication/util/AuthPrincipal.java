package com.bookingSeatApplication.util;

/** Server-resolved identity placed in the SecurityContext. Built from the database, never from request fields. */
public record AuthPrincipal(String role, int id, String subject) {

    public static final String ADMIN = "ADMIN";
    public static final String PASSENGER = "PASSENGER";
    public static final String BUS_OWNER = "BUS_OWNER";
}
