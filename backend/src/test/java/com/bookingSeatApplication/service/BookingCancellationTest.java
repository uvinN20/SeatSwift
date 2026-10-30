package com.bookingSeatApplication.service;
import com.bookingSeatApplication.dao.impl.BookingDaoImpl;
import com.bookingSeatApplication.exception.*;
import com.bookingSeatApplication.model.*;
import com.bookingSeatApplication.service.impl.BookingServiceImpl;
import java.time.*;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
class BookingCancellationTest {
    JdbcTemplate db; BookingDaoImpl dao; BookingServiceImpl service;
    @BeforeEach void setup() {
        var source=new JdbcDataSource();
        source.setURL("jdbc:h2:mem:cancel"+System.nanoTime()+";MODE=MySQL;DB_CLOSE_DELAY=-1");
        db=new JdbcTemplate(source);
        db.execute("CREATE TABLE schedules(schedule_id INT PRIMARY KEY,travel_date DATE,departure_time TIME)");
        db.execute("CREATE TABLE bookings(booking_id INT PRIMARY KEY,schedule_id INT,seat_id INT,passenger_id INT,"+
            "passenger_name VARCHAR(150),phone_number VARCHAR(40),booking_reference VARCHAR(40),booking_status VARCHAR(20),amount DECIMAL(10,2),"+
            "active_seat_id INT GENERATED ALWAYS AS (CASE WHEN booking_status='CANCELLED' THEN NULL ELSE seat_id END),UNIQUE(schedule_id,active_seat_id))");
        db.update("INSERT INTO schedules VALUES(1,'2026-10-30','10:00:00')");
        db.update("INSERT INTO bookings(booking_id,schedule_id,seat_id,passenger_id,booking_status) VALUES(1,1,1,7,'PENDING_PAYMENT')");
        dao=new BookingDaoImpl();ReflectionTestUtils.setField(dao,"jdbcTemplate",db);
        service=new BookingServiceImpl();ReflectionTestUtils.setField(service,"bookingDao",dao);
        setTime("2026-10-30T04:29:59Z");
    }
    void setTime(String instant) {
        ReflectionTestUtils.setField(service,"bookingWindow",new BookingWindow(Clock.fixed(Instant.parse(instant),ZoneId.of("Asia/Colombo"))));
    }
    @Test void releasesSeatPreservesHistoryAndAllowsRebooking() {
        service.cancelBooking(1,7);service.cancelBooking(1,7);
        assertEquals(BookingStatus.CANCELLED,dao.findById(1).getBookingStatus());
        assertFalse(dao.isSeatAlreadyBooked(1,1));
        db.update("INSERT INTO bookings(booking_id,schedule_id,seat_id,passenger_id,booking_status) VALUES(2,1,1,8,'PENDING_PAYMENT')");
        assertEquals(2,db.queryForObject("SELECT COUNT(*) FROM bookings",Integer.class));
    }
    @Test void confirmedBookingCanBeCancelledAndCannotBeReconfirmed() {
        db.update("UPDATE bookings SET booking_status='CONFIRMED' WHERE booking_id=1");
        service.cancelBooking(1,7);
        assertFalse(dao.isSeatAlreadyBooked(1,1));assertEquals(0,dao.confirmIfPendingPayment(1));
    }
    @Test void rejectsOtherPassengersAndMissingBookings() {
        assertThrows(NotFoundException.class,()->service.cancelBooking(1,8));
        assertThrows(NotFoundException.class,()->service.cancelBooking(99,7));
        assertTrue(dao.isSeatAlreadyBooked(1,1));
    }
    @Test void rejectsAtDepartureAndLater() {
        setTime("2026-10-30T04:30:00Z");
        assertThrows(ConflictException.class,()->service.cancelBooking(1,7));
        setTime("2026-10-30T05:30:00Z");
        assertThrows(ConflictException.class,()->service.cancelBooking(1,7));
        assertTrue(dao.isSeatAlreadyBooked(1,1));
    }
}
