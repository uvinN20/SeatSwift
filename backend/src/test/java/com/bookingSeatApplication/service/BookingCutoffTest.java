package com.bookingSeatApplication.service;
import com.bookingSeatApplication.dao.*;
import com.bookingSeatApplication.dto.*;
import com.bookingSeatApplication.model.*;
import com.bookingSeatApplication.service.impl.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
class BookingCutoffTest {
    ScheduleDao schedules; BookingDao bookings; BookingServiceImpl service; ScheduleServiceImpl search;
    @BeforeEach void init() {
        schedules=mock(ScheduleDao.class);bookings=mock(BookingDao.class);service=new BookingServiceImpl();search=new ScheduleServiceImpl();
        var clock=Clock.fixed(Instant.parse("2026-10-21T02:30:00Z"),ZoneId.of("Asia/Colombo"));
        var window=new BookingWindow(clock);
        ReflectionTestUtils.setField(service,"bookingDao",bookings);ReflectionTestUtils.setField(service,"scheduleDao",schedules);ReflectionTestUtils.setField(service,"bookingWindow",window);
        ReflectionTestUtils.setField(search,"scheduleDao",schedules);ReflectionTestUtils.setField(search,"bookingWindow",window);
    }
    Schedule schedule(int hour,int minute) {
        Schedule s=new Schedule();s.setScheduleId(1);s.setTravelDate(LocalDate.of(2026,10,21));s.setDepartureTime(LocalTime.of(hour,minute));s.setPrice(new BigDecimal("1200"));return s;
    }
    BookingRequestDto request() {var r=new BookingRequestDto();r.setScheduleId(1);r.setSeatId(4);r.setPassengerName("Test Passenger");r.setPhoneNumber("0771234567");return r;}
    @Test void directBookingInsideOneHourDoesNotWriteToDatabase() {
        when(schedules.getScheduleById(1)).thenReturn(schedule(8,59));
        assertThrows(IllegalArgumentException.class,()->service.bookSeat(request(),99));verifyNoInteractions(bookings);
    }
    @Test void exactBoundaryBooksSeatWithAuthenticatedOwner() {
        when(schedules.getScheduleById(1)).thenReturn(schedule(9,0));when(bookings.isSeatOnScheduleBus(1,4)).thenReturn(true);when(bookings.saveBooking(any())).thenReturn(7);
        assertEquals("REF0007",service.bookSeat(request(),99));
        verify(bookings).saveBooking(argThat(b->b.getPassengerId()==99 && b.getBookingStatus()==BookingStatus.PENDING_PAYMENT && b.getAmount().compareTo(new BigDecimal("1200"))==0));
    }
    @Test void searchAndBookingShareBoundary() {
        var a=new ScheduleSearchResultDto();a.setTravelDate(LocalDate.of(2026,10,21));a.setDepartureTime(LocalTime.of(8,59));
        var b=new ScheduleSearchResultDto();b.setTravelDate(a.getTravelDate());b.setDepartureTime(LocalTime.of(9,0));
        when(schedules.search("Colombo","Kandy",a.getTravelDate())).thenReturn(List.of(a,b));
        assertEquals(List.of(b),search.search("Colombo","Kandy",a.getTravelDate()));
    }
    @Test void databaseRaceRemainsAConflict() {
        when(schedules.getScheduleById(1)).thenReturn(schedule(10,0));when(bookings.isSeatOnScheduleBus(1,4)).thenReturn(true);
        when(bookings.saveBooking(any())).thenThrow(new org.springframework.dao.DuplicateKeyException("seat race"));
        assertThrows(com.bookingSeatApplication.exception.ConflictException.class,()->service.bookSeat(request(),99));
    }
}
