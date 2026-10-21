package com.bookingSeatApplication.service;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.springframework.stereotype.Component;
/** Single authoritative booking rule. The exact one-hour boundary is inclusive. */
@Component
public class BookingWindow {
    private final Clock clock;
    public BookingWindow(Clock clock) { this.clock = clock; }
    public LocalDate today() { return LocalDate.now(clock); }
    public LocalDateTime earliestDeparture() { return LocalDateTime.now(clock).plusHours(1); }
    public boolean allows(LocalDate date, LocalTime time) {
        return date != null && time != null && !LocalDateTime.of(date, time).isBefore(earliestDeparture());
    }
    public void requireBookable(LocalDate date, LocalTime time) {
        if (!allows(date, time)) throw new IllegalArgumentException(
            "Bookings close 1 hour before departure (Sri Lanka time). Please choose a later bus.");
    }
}
