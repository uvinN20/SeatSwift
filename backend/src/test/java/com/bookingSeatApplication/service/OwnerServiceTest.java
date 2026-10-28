package com.bookingSeatApplication.service;

import com.bookingSeatApplication.dao.OwnerDao;
import com.bookingSeatApplication.dao.impl.*;
import com.bookingSeatApplication.dto.OwnerDtos.*;
import com.bookingSeatApplication.exception.ConflictException;
import com.bookingSeatApplication.exception.NotFoundException;
import com.bookingSeatApplication.service.impl.OwnerService;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import javax.sql.DataSource;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class OwnerServiceTest {
    @Configuration
    @EnableTransactionManagement
    @Import({OwnerService.class,OwnerDaoImpl.class,AdminUserDaoImpl.class,SeatDaoImpl.class,BookingWindow.class})
    static class Config {
        @Bean DataSource dataSource() {
            var ds=new JdbcDataSource(); ds.setURL("jdbc:h2:mem:owners"+UUID.randomUUID()+";MODE=MySQL;DB_CLOSE_DELAY=-1"); return ds;
        }
        @Bean JdbcTemplate jdbcTemplate(DataSource ds) { return new JdbcTemplate(ds); }
        @Bean DataSourceTransactionManager transactionManager(DataSource ds) { return new DataSourceTransactionManager(ds); }
        @Bean PasswordEncoder encoder() { return new BCryptPasswordEncoder(4); }
        @Bean Clock clock() { return Clock.fixed(Instant.parse("2026-10-21T02:30:00Z"),ZoneId.of("Asia/Colombo")); }
    }
    AnnotationConfigApplicationContext ctx;
    JdbcTemplate db;
    OwnerService service;
    OwnerDao dao;
    final LocalDate day=LocalDate.of(2026,10,21);
    @BeforeEach void setup() {
        ctx=new AnnotationConfigApplicationContext(Config.class);
        db=ctx.getBean(JdbcTemplate.class); service=ctx.getBean(OwnerService.class); dao=ctx.getBean(OwnerDao.class);
        String ddl="""
          CREATE TABLE admin_users(admin_id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(100) UNIQUE,password VARCHAR(255));
          INSERT INTO admin_users(username,password) VALUES ('uvin','unused');
          CREATE TABLE routes(route_id INT PRIMARY KEY,source VARCHAR(100),destination VARCHAR(100));
          INSERT INTO routes VALUES (1,'Colombo','Kandy'),(2,'Galle','Matara');
          CREATE TABLE buses(bus_id INT PRIMARY KEY,route_id INT,total_seats INT);
          INSERT INTO buses VALUES (1,1,2),(2,2,2),(3,1,2);
          CREATE TABLE owner_users(owner_id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(60) UNIQUE,full_name VARCHAR(150),phone_number VARCHAR(40),password VARCHAR(255),active BOOLEAN,approval_status VARCHAR(20) DEFAULT 'PENDING',reviewed_by INT REFERENCES admin_users(admin_id),reviewed_at TIMESTAMP,review_note VARCHAR(500),verification_details VARCHAR(1000));
          CREATE TABLE owner_approval_audit(audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,owner_id INT REFERENCES owner_users(owner_id),admin_id INT REFERENCES admin_users(admin_id),decision VARCHAR(20),reason VARCHAR(500),reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
          CREATE TABLE bus_owners(bus_id INT PRIMARY KEY REFERENCES buses(bus_id),owner_id INT REFERENCES owner_users(owner_id));
          CREATE TABLE schedules(schedule_id INT AUTO_INCREMENT PRIMARY KEY,route_id INT,bus_id INT,travel_date DATE,departure_time TIME,price DECIMAL(10,2));
          INSERT INTO schedules VALUES (1,1,1,'2026-10-21','10:00:00',1000),(2,2,2,'2026-10-21','11:00:00',800);
          CREATE TABLE seats(seat_id INT PRIMARY KEY,bus_id INT,seat_number VARCHAR(20));
          INSERT INTO seats VALUES (1,1,'A1'),(2,1,'A2'),(3,2,'A1'),(4,2,'A2');
          CREATE TABLE bookings(booking_id INT PRIMARY KEY,schedule_id INT,seat_id INT,passenger_name VARCHAR(150),phone_number VARCHAR(40),booking_reference VARCHAR(40),booking_status VARCHAR(20),amount DECIMAL(10,2));
          INSERT INTO bookings VALUES (1,1,1,'Passenger One','0771111111','BK-1','CONFIRMED',1000),(2,1,2,'Cancelled Passenger','0772222222','BK-2','CANCELLED',1000),(3,2,3,'Other Owner Passenger','0773333333','BK-3','PENDING_PAYMENT',800);
          """;
        for (String sql:ddl.split(";")) if(!sql.isBlank()) db.execute(sql);
    }
    @AfterEach void close() { ctx.close(); }
    AccountRequest account(String username,List<Integer> ids) { return new AccountRequest(username,"Test Owner","0771234567","Owner12345",true,ids); }
    NewTrip trip(int bus,String time) { return new NewTrip(bus,day,LocalTime.parse(time),new BigDecimal("1200.50")); }
    @Test void scopesFleetTripsSeatsAndPassengerDetails() {
        int one=service.save(null,account("ownerone",List.of(1)));
        int two=service.save(null,account("ownertwo",List.of(2)));
        assertTrue(ctx.getBean(PasswordEncoder.class).matches("Owner12345",dao.findById(one).password()));
        assertEquals(List.of(1),service.fleet(one).stream().map(FleetBus::busId).toList());
        assertEquals(List.of(1),service.trips(one,day).stream().map(Trip::scheduleId).toList());
        var detail=service.detail(one,1);
        assertEquals(1,detail.trip().bookedSeats()); assertEquals(1,detail.trip().confirmedSeats());
        assertEquals(0,new BigDecimal("1000").compareTo(detail.trip().confirmedValue()));
        assertTrue(detail.seats().get(0).getBooked()); assertFalse(detail.seats().get(1).getBooked());
        assertEquals(2,detail.reservations().size());
        assertThrows(NotFoundException.class,()->service.detail(one,2));
        assertThrows(NotFoundException.class,()->service.detail(two,1));
        assertThrows(NotFoundException.class,()->service.createTrip(one,trip(2,"13:00")));
    }
    @Test void departuresEnforceOneHourBoundaryOwnershipAndDuplicateTime() {
        int owner=service.save(null,account("ownerone",List.of(1)));
        assertThrows(IllegalArgumentException.class,()->service.createTrip(owner,trip(1,"08:59:59")));
        service.createTrip(owner,trip(1,"09:00"));
        assertEquals(2,service.trips(owner,day).size());
        assertThrows(ConflictException.class,()->service.createTrip(owner,trip(1,"09:00")));
        assertEquals(1,db.queryForObject("SELECT route_id FROM schedules WHERE departure_time='09:00:00'",Integer.class));
        assertThrows(IllegalArgumentException.class,()->service.createTrip(owner,new NewTrip(1,day,LocalTime.NOON,new BigDecimal("0"))));
    }
    @Test void ownerCanUpdateAndDeleteOnlyUnbookedAssignedDepartures() {
        int owner=service.save(null,account("ownerone",List.of(1)));
        service.createTrip(owner,trip(1,"13:00"));
        int id=db.queryForObject("SELECT MAX(schedule_id) FROM schedules",Integer.class);
        service.updateTrip(owner,id,new NewTrip(1,day,LocalTime.parse("14:30"),new BigDecimal("1350.00")));
        assertEquals(LocalTime.parse("14:30"),db.queryForObject("SELECT departure_time FROM schedules WHERE schedule_id=?",LocalTime.class,id));
        assertEquals(0,new BigDecimal("1350.00").compareTo(db.queryForObject("SELECT price FROM schedules WHERE schedule_id=?",BigDecimal.class,id)));
        assertThrows(NotFoundException.class,()->service.updateTrip(owner,id,new NewTrip(2,day,LocalTime.NOON,new BigDecimal("1000"))));
        service.deleteTrip(owner,id);
        assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM schedules WHERE schedule_id=?",Integer.class,id));
        assertThrows(NotFoundException.class,()->service.deleteTrip(owner,id));
    }
    @Test void bookingHistoryLocksDepartureUpdatesAndDeletion() {
        int owner=service.save(null,account("ownerone",List.of(1)));
        assertTrue(dao.hasBookingHistory(1));
        assertThrows(ConflictException.class,()->service.updateTrip(owner,1,new NewTrip(1,day,LocalTime.parse("12:00"),new BigDecimal("1500"))));
        assertThrows(ConflictException.class,()->service.deleteTrip(owner,1));
        assertEquals(2,db.queryForObject("SELECT COUNT(*) FROM bookings WHERE schedule_id=1",Integer.class));
        assertEquals(LocalTime.parse("10:00"),db.queryForObject("SELECT departure_time FROM schedules WHERE schedule_id=1",LocalTime.class));
    }
    @Test void accountAndAssignmentsRollbackOnFailure() {
        service.save(null,account("ownerone",List.of(1)));
        assertThrows(ConflictException.class,()->service.save(null,account("ownertwo",List.of(1,2))));
        assertNull(dao.findByUsername("ownertwo"));
        assertThrows(IllegalArgumentException.class,()->service.save(null,account("badbus",List.of(999))));
        assertNull(dao.findByUsername("badbus"));
        assertThrows(ConflictException.class,()->service.save(null,account("uvin",List.of())));
        assertThrows(IllegalArgumentException.class,()->service.save(null,account("name@email.com",List.of())));
    }
    @Test void updatesPreservePasswordsAndReassignmentRevokesFormerOwnersAccess() {
        int one=service.save(null,account("ownerone",List.of(1)));
        int two=service.save(null,account("ownertwo",List.of(2)));
        String hash=dao.findById(one).password();
        service.save(one,new AccountRequest("ownerone","Updated Name","0770000000","",false,List.of()));
        assertEquals(hash,dao.findById(one).password()); assertFalse(dao.findById(one).active());
        service.save(two,new AccountRequest("ownertwo","Second Owner","0771234567","NewPassword123",true,List.of(1,2)));
        assertThrows(NotFoundException.class,()->service.detail(one,1));
        assertEquals(1,service.detail(two,1).trip().scheduleId());
        assertTrue(ctx.getBean(PasswordEncoder.class).matches("NewPassword123",dao.findById(two).password()));
    }
    @Test void ownerApplicationStaysPendingAndCannotAssignBuses() {
        service.apply(new OwnerApplication("applicant","Genuine Owner","0771234567","Owner12345","Operator: Test Travel; Bus ABC-1234; ownership reference REG-123"));
        var user=dao.findByUsername("applicant");
        assertNotNull(user); assertEquals("PENDING",user.approvalStatus());
        assertTrue(service.fleet(user.ownerId()).isEmpty());
        assertTrue(service.accounts().getFirst().verificationDetails().contains("ABC-1234"));
        assertThrows(IllegalArgumentException.class,()->service.apply(new OwnerApplication("badrequest","Owner","0771234567","Owner12345","")));
        assertNull(dao.findByUsername("badrequest"));
    }
    @Test void approvalIsExplicitAuditedAndPreservedByAccountEdits() {
        int owner=service.save(null,account("ownerone",List.of(1)));
        assertEquals("PENDING",dao.findById(owner).approvalStatus());
        service.save(owner,new AccountRequest("ownerone","Updated Name","0771234567","",true,List.of(1)));
        assertEquals("PENDING",dao.findById(owner).approvalStatus());
        assertThrows(IllegalArgumentException.class,()->service.review(owner,1,new ApprovalRequest("REJECTED","",false)));
        assertThrows(IllegalArgumentException.class,()->service.review(owner,1,new ApprovalRequest("PENDING",null,false)));
        assertThrows(IllegalArgumentException.class,()->service.review(owner,1,new ApprovalRequest("APPROVED","Documents checked",false)));
        service.review(owner,1,new ApprovalRequest("APPROVED","Documents checked",true));
        assertEquals("APPROVED",dao.findById(owner).approvalStatus());
        var account=service.accounts().getFirst();
        assertEquals(1,account.reviewedBy()); assertNotNull(account.reviewedAt());
        assertEquals("Documents checked",account.reviewNote());
        service.save(owner,new AccountRequest("ownerone","Updated Name","0771234567","",true,List.of(1)));
        assertEquals("APPROVED",dao.findById(owner).approvalStatus());
        service.review(owner,1,new ApprovalRequest("REJECTED","Approval revoked",false));
        assertEquals("REJECTED",dao.findById(owner).approvalStatus());
        assertEquals(2,db.queryForObject("SELECT COUNT(*) FROM owner_approval_audit",Integer.class));
        assertThrows(NotFoundException.class,()->service.review(999,1,new ApprovalRequest("APPROVED","Documents checked",true)));
    }
}
