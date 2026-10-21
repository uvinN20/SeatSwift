package com.bookingSeatApplication.demo;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/** Local demo only. All data is synthetic; no payment-slip evidence is fabricated. */
@Component
@ConditionalOnProperty(name="app.demo.enabled", havingValue="true")
public class DemoDataInitializer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);
    private static final String[] TIMES = {"06:00:00","08:00:00","10:00:00","12:00:00","14:00:00","16:00:00","19:00:00","22:00:00"};
    private static final String[] NAMES = {"Nimal Perera","Kamal Silva","Amali Fernando","Dilini Jayasinghe","Kasun Rathnayake","Sanduni Dias","Ruwan Senanayake","Tharushi De Silva","Arun Kumar","Fathima Nazeer"};
    private final JdbcTemplate db;
    private final PasswordEncoder encoder;
    private final TransactionTemplate tx;
    private final Clock clock;
    private final int days;
    private final String adminName, adminPassword, passengerPassword, ownerPassword;
    public DemoDataInitializer(JdbcTemplate db, PasswordEncoder encoder, TransactionTemplate tx, Clock clock,
            @Value("${app.demo.days:14}") int days,
            @Value("${app.demo.admin-username:uvin}") String adminName,
            @Value("${app.demo.admin-password}") String adminPassword,
            @Value("${app.demo.passenger-password}") String passengerPassword,
            @Value("${app.demo.owner-password}") String ownerPassword) {
        this.db=db; this.encoder=encoder; this.tx=tx; this.clock=clock;
        if(days<3 || days>60) throw new IllegalArgumentException("Demo days must be between 3 and 60");
        this.days=days;this.adminName=adminName;this.adminPassword=adminPassword;
        this.passengerPassword=passengerPassword;this.ownerPassword=ownerPassword;
    }
    @Override public void run(ApplicationArguments args) {
        log.info("Preparing SeatSwift demo data. First startup can take a little longer.");
        refresh();
    }
    @Scheduled(cron="0 5 0 * * *", zone="${app.timezone:Asia/Colombo}")
    public void refresh() {
        tx.executeWithoutResult(status -> seed());
        log.info("Demo timetable ready: 8 buses per route, 8–10 occupied seats per departure, {} days from {}.",days,LocalDate.now(clock));
    }
    private Integer id(String sql, Object... params) {
        List<Integer> ids=db.query(sql,(rs,n)->rs.getInt(1),params);
        return ids.isEmpty()?null:ids.getFirst();
    }
    private int lastId() { return db.queryForObject("SELECT LAST_INSERT_ID()",Integer.class); }
    private void seed() {
        // Single transaction + shared row lock serialize two app instances and all seed writes.
        db.queryForObject("SELECT seed_key FROM demo_seed_state WHERE seed_key='lock' FOR UPDATE",String.class);
        if(id("SELECT 1 FROM demo_seed_state WHERE seed_key='admin-java25-v1'")==null) {
            String hash=encoder.encode(adminPassword);
            Integer admin=id("SELECT admin_id FROM admin_users WHERE username=?",adminName);
            if(admin==null) db.update("INSERT INTO admin_users(username,password) VALUES (?,?)",adminName,hash);
            else db.update("UPDATE admin_users SET password=? WHERE admin_id=?",hash,admin);
            db.update("INSERT INTO demo_seed_state(seed_key) VALUES ('admin-java25-v1')");
        }
        for(String destination:List.of("Kandy","Galle","Matara","Jaffna","Trincomalee","Anuradhapura","Badulla","Ella")) {
            route("Colombo",destination); route(destination,"Colombo");
        }
        route("Kandy","Nuwara Eliya");route("Nuwara Eliya","Kandy");route("Galle","Matara");route("Matara","Galle");
        List<Integer> routes=db.query("SELECT route_id FROM routes ORDER BY route_id",(rs,n)->rs.getInt(1));
        LocalDate today=LocalDate.now(clock);
        String passengerHash=encoder.encode(passengerPassword);
        for(int route:routes) for(int slot=0;slot<TIMES.length;slot++) {
            Integer bus=id("SELECT bus_id FROM demo_bus_slots WHERE route_id=? AND slot=?",route,slot);
            if(bus==null) {
                db.update("INSERT INTO buses(route_id,travel_date,travel_time,total_seats) VALUES (?,?,?,40)",route,today,TIMES[slot]);
                bus=lastId();
                db.update("INSERT INTO demo_bus_slots(route_id,slot,bus_id) VALUES (?,?,?)",route,slot,bus);
                List<Object[]> seats=new ArrayList<>();
                for(int n=1;n<=40;n++) seats.add(new Object[]{bus,Integer.toString(n)});
                db.batchUpdate("INSERT INTO seats(bus_id,seat_number,is_booked) VALUES (?,?,FALSE)",seats);
            }
            int occupied=8+Math.floorMod(route+slot,3);
            List<Integer> passengers=new ArrayList<>();
            for(int n=1;n<=occupied;n++) {
                String email="demo-r"+route+"-b"+slot+"-p"+n+"@seatswift.example";
                Integer passenger=id("SELECT passenger_id FROM passengers WHERE email=?",email);
                if(passenger==null) {
                    db.update("INSERT INTO passengers(passenger_name,email,phone_number,password) VALUES (?,?,?,?)",
                        "Demo "+NAMES[n-1],email,"070"+String.format("%07d",route*1000+slot*10+n),passengerHash);
                    passenger=lastId();
                }
                passengers.add(passenger);
            }
            List<Integer> seats=db.query("SELECT seat_id FROM seats WHERE bus_id=? ORDER BY LENGTH(seat_number), seat_number", (rs,n)->rs.getInt(1),bus);
            BigDecimal fare=BigDecimal.valueOf(800L+(route%6)*200L+(slot%3)*50L);
            for(int day=0;day<days;day++) {
                LocalDate date=today.plusDays(day);
                Integer schedule=id("SELECT schedule_id FROM schedules WHERE bus_id=? AND travel_date=? AND departure_time=? ORDER BY schedule_id LIMIT 1",bus,date,TIMES[slot]);
                if(schedule==null) {
                    db.update("INSERT INTO schedules(route_id,bus_id,travel_date,departure_time,price) VALUES (?,?,?,?,?)",route,bus,date,TIMES[slot],fare);
                    schedule=lastId();
                }
                if(id("SELECT schedule_id FROM demo_schedules WHERE schedule_id=?",schedule)!=null) continue;
                List<Object[]> reservations=new ArrayList<>();
                for(int n=0;n<occupied;n++) {
                    int seat=seats.get(n);
                    reservations.add(new Object[]{schedule,seat,passengers.get(n),"Demo "+NAMES[n],"070"+String.format("%07d",route*1000+slot*10+n+1),"DEMO-"+schedule+"-"+seat,fare,schedule,seat});
                }
                db.batchUpdate("INSERT INTO bookings(schedule_id,seat_id,passenger_id,passenger_name,phone_number,booking_reference,booking_status,amount) "
                    +"SELECT ?,?,?,?,?,?,'CONFIRMED',? WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE schedule_id=? AND seat_id=? AND booking_status<>'CANCELLED')",reservations);
                db.update("INSERT INTO demo_schedules(schedule_id) VALUES (?)",schedule);
            }
        }
        seedOwners();
    }
    private void seedOwners() {
        if(id("SELECT 1 FROM demo_seed_state WHERE seed_key='owner-demo-v1'")!=null) return;
        int admin=id("SELECT admin_id FROM admin_users WHERE username=?",adminName);
        String hash=encoder.encode(ownerPassword);
        String[] towns={"Kandy","Galle","Matara","Jaffna","Ella"};
        for(int n=0;n<towns.length;n++) {
            String username="demo_owner_"+towns[n].toLowerCase(java.util.Locale.ROOT);
            // Never promote or change a pre-existing account, including a username collision.
            if(id("SELECT owner_id FROM owner_users WHERE username=?",username)!=null
                    || id("SELECT admin_id FROM admin_users WHERE username=?",username)!=null) continue;
            String details="DEMO ONLY: fictional "+towns[n]+" Travel business; registration DEMO-BIZ-00"+(n+1)
                +"; bus ownership reference DEMO-BUS-00"+(n+1)
                +"; proposed route Colombo to "+towns[n]+". Original business registration, identity and vehicle ownership documents requested for manual review. No real documents attached.";
            db.update("INSERT INTO owner_users(username,full_name,phone_number,password,active,approval_status,verification_details) VALUES (?,?,?,?,TRUE,'PENDING',?)",
                username,"Demo "+towns[n]+" Operator","DEMO-CONTACT-00"+(n+1),hash,details);
            int owner=lastId();
            if(n>=3) {
                String note="DEMO ONLY: simulated administrator verification of identity, business registration and bus ownership. No real original documents were reviewed.";
                db.update("UPDATE owner_users SET approval_status='APPROVED',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,review_note=? WHERE owner_id=?",admin,note,owner);
                db.update("INSERT INTO owner_approval_audit(owner_id,admin_id,decision,reason) VALUES (?,?,'APPROVED',?)",owner,admin,note);
                // Only available demo buses on this route; never transfer another owner's fleet.
                db.update("INSERT INTO bus_owners(bus_id,owner_id) SELECT d.bus_id,? FROM demo_bus_slots d JOIN routes r ON r.route_id=d.route_id WHERE r.source='Colombo' AND r.destination=? AND d.slot<3 AND NOT EXISTS (SELECT 1 FROM bus_owners bo WHERE bo.bus_id=d.bus_id)",owner,towns[n]);
            }
        }
        db.update("INSERT INTO demo_seed_state(seed_key) VALUES ('owner-demo-v1')");
    }
    private void route(String from,String to) {
        if(id("SELECT route_id FROM routes WHERE source=? AND destination=?",from,to)==null)
            db.update("INSERT INTO routes(source,destination) VALUES (?,?)",from,to);
    }
}
