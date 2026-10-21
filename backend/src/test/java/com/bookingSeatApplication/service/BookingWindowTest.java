package com.bookingSeatApplication.service;
import java.time.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class BookingWindowTest {
    private BookingWindow at(String local) {
        ZoneId zone=ZoneId.of("Asia/Colombo");
        return new BookingWindow(Clock.fixed(LocalDateTime.parse(local).atZone(zone).toInstant(),zone));
    }
    @Test void eightAmAllowsNineAmButNotEightFiftyNine() {
        var w=at("2026-10-21T08:00:00"); var d=LocalDate.of(2026,10,21);
        assertFalse(w.allows(d,LocalTime.of(8,59,59)));
        assertTrue(w.allows(d,LocalTime.of(9,0)));
        assertTrue(w.allows(d,LocalTime.of(12,0)));
    }
    @Test void oneSecondInsideWindowIsRejected() {
        var w=at("2026-10-21T08:00:01");
        assertFalse(w.allows(LocalDate.of(2026,10,21),LocalTime.of(9,0)));
    }
    @Test void cutoffCrossesMidnight() {
        var w=at("2026-10-21T23:30:00"); var tomorrow=LocalDate.of(2026,10,22);
        assertFalse(w.allows(tomorrow,LocalTime.of(0,29)));
        assertTrue(w.allows(tomorrow,LocalTime.of(0,30)));
        assertTrue(w.allows(tomorrow.plusDays(1),LocalTime.of(6,0)));
    }
    @Test void businessDateUsesSriLankaNotUtc() {
        var w=new BookingWindow(Clock.fixed(Instant.parse("2026-10-20T20:00:00Z"),ZoneId.of("Asia/Colombo")));
        assertEquals(LocalDate.of(2026,10,21),w.today());
    }
    @Test void departedAndMissingDatesAreRejected() {
        var w=at("2026-10-21T08:00:00");
        assertFalse(w.allows(LocalDate.of(2026,10,20),LocalTime.NOON));
        assertFalse(w.allows(null,LocalTime.NOON));
        assertThrows(IllegalArgumentException.class,()->w.requireBookable(LocalDate.of(2026,10,21),LocalTime.of(8,30)));
    }
}
