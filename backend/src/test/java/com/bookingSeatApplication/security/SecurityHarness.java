package com.bookingSeatApplication.security;

import com.bookingSeatApplication.dao.*;
import com.bookingSeatApplication.dto.*;
import com.bookingSeatApplication.model.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.*;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import java.lang.reflect.*;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Boots the REAL security configuration, JWT filter, controllers and services in an embedded server and
 * calls them over HTTP. Only the database layer (DAOs) is replaced by in-memory stand-ins, so it needs no MySQL.
 * Run through {@link SecurityIntegrationTest}.
 */
public class SecurityHarness {

    // ------------------------------------------------------------------ in-memory database stand-ins
    static final BCryptPasswordEncoder ENC = new BCryptPasswordEncoder();
    static final Map<String, Passenger> passengers = new ConcurrentHashMap<>();
    static final List<Booking> bookings = Collections.synchronizedList(new ArrayList<>());
    static final Map<Integer, Payment> payments = new ConcurrentHashMap<>();
    static final AtomicInteger bookingSeq = new AtomicInteger(1);
    static volatile boolean ownerActive = true;
    static volatile String ownerApprovalStatus = "APPROVED";
    static int reviewingAdminId;
    static final LocalDate TRAVEL = LocalDate.now(ZoneId.of("Asia/Colombo")).plusDays(2);

    @SuppressWarnings("unchecked")
    static <T> T fake(Class<T> c, InvocationHandler h) {
        return (T) Proxy.newProxyInstance(c.getClassLoader(), new Class[]{c}, (proxy, m, args) -> {
            if (m.getDeclaringClass() == Object.class) {
                return switch (m.getName()) { case "hashCode" -> System.identityHashCode(proxy); case "equals" -> proxy == args[0]; default -> c.getSimpleName() + "Fake"; };
            }
            return h.invoke(proxy, m, args);
        });
    }

    @Import(com.bookingSeatApplication.service.BookingWindow.class)
    @SpringBootConfiguration
    @EnableAutoConfiguration
    @ComponentScan(basePackages = {"com.bookingSeatApplication.config", "com.bookingSeatApplication.controller",
            "com.bookingSeatApplication.util", "com.bookingSeatApplication.exception",
            "com.bookingSeatApplication.service.impl", "com.bookingSeatApplication.storage"})
    static class App {

        @Bean org.springframework.transaction.PlatformTransactionManager txm() {
            return new AbstractPlatformTransactionManager() { // no real DB here: transactions are no-ops
                protected Object doGetTransaction() { return new Object(); }
                protected void doBegin(Object t, TransactionDefinition d) {}
                protected void doCommit(DefaultTransactionStatus s) {}
                protected void doRollback(DefaultTransactionStatus s) {}
            };
        }

        @Bean AdminUserDao adminUserDao() {
            AdminUser a = new AdminUser(); a.setAdminId(1); a.setUsername("admin"); a.setPassword(ENC.encode("admin123"));
            return fake(AdminUserDao.class, (p, m, args) -> m.getName().equals("findByUsername") && "admin".equals(args[0]) ? a : null);
        }

        @Bean PassengerDao passengerDao() {
            return fake(PassengerDao.class, (p, m, args) -> switch (m.getName()) {
                case "findByEmail" -> passengers.get((String) args[0]);
                case "save" -> { Passenger x = (Passenger) args[0]; x.setPassengerId(100 + passengers.size()); passengers.put(x.getEmail(), x); yield null; }
                default -> null; });
        }

        @Bean OwnerDao ownerDao() {
            return fake(OwnerDao.class, (p,m,args) -> switch (m.getName()) {
                case "findByUsername" -> "owner1".equals(args[0]) ? new OwnerUser(1,"owner1","Demo Owner","0771234567",ENC.encode("Owner12345"),ownerActive,ownerApprovalStatus) : null;
                case "create" -> 2;
                case "review" -> { ownerApprovalStatus=(String)args[2]; reviewingAdminId=(Integer)args[1]; yield null; }
                case "accounts", "fleet", "trips", "reservations" -> List.of();
                case "ownsBus" -> false;
                default -> null;
            });
        }

        @Bean RouteDao routeDao() {
            Route r = new Route(); r.setRouteId(1); r.setSource("Colombo"); r.setDestination("Kandy");
            return fake(RouteDao.class, (p, m, args) -> List.of(r));
        }

        @Bean BusDao busDao() {
            Bus b = new Bus(); b.setBusId(1); b.setRouteId(1); b.setTotalSeats(40);
            return fake(BusDao.class, (p, m, args) -> List.of(b));
        }

        static List<Seat> seatsOf(int busId, int scheduleId) {
            List<Seat> out = new ArrayList<>();
            for (String r : new String[]{"A", "B"}) for (int c = 1; c <= 4; c++) {
                Seat s = new Seat(); s.setBusId(busId); s.setSeatNumber(r + c);
                s.setSeatId(busId * 100 + out.size() + 1);
                s.setBooked(scheduleId > 0 && bookings.stream().anyMatch(b -> b.getScheduleId() == scheduleId && b.getSeatId() == s.getSeatId() && b.getBookingStatus() != BookingStatus.CANCELLED));
                out.add(s);
            }
            return out;
        }

        @Bean SeatDao seatDao() {
            return fake(SeatDao.class, (p, m, args) -> switch (m.getName()) {
                case "getSeatsByBus" -> seatsOf((Integer) args[0], 0);
                case "getSeatsForSchedule" -> (Integer) args[0] == 1 ? seatsOf(1, 1) : List.of();
                default -> null; });
        }

        @Bean ScheduleDao scheduleDao() {
            Schedule s = new Schedule(); s.setScheduleId(1); s.setRouteId(1); s.setBusId(1); s.setTravelDate(TRAVEL); s.setDepartureTime(LocalTime.of(9, 30)); s.setPrice(new BigDecimal("1500.00"));
            return fake(ScheduleDao.class, (p, m, args) -> switch (m.getName()) {
                case "getAllSchedules" -> List.of(s);
                case "getScheduleById" -> { if ((Integer) args[0] != 1) throw new com.bookingSeatApplication.exception.NotFoundException("Schedule not found"); yield s; }
                case "search" -> { ScheduleSearchResultDto d = new ScheduleSearchResultDto(); d.setScheduleId(1); d.setRouteId(1); d.setSource("Colombo"); d.setDestination("Kandy"); d.setBusId(1); d.setTravelDate(TRAVEL); d.setDepartureTime(LocalTime.of(9, 30)); d.setPrice(new BigDecimal("1500.00")); d.setTotalSeats(8); d.setAvailableSeats(8); yield List.of(d); }
                case "addSchedule" -> null;
                default -> null; });
        }

        @Bean BookingDao bookingDao() {
            return fake(BookingDao.class, (p, m, args) -> switch (m.getName()) {
                case "isSeatOnScheduleBus" -> ((Integer) args[1]) / 100 == 1 && ((Integer) args[0]) == 1;
                case "isSeatAlreadyBooked" -> bookings.stream().anyMatch(b -> b.getScheduleId() == (Integer) args[0] && b.getSeatId() == (Integer) args[1] && b.getBookingStatus() != BookingStatus.CANCELLED);
                case "saveBooking" -> { Booking b = (Booking) args[0];
                    synchronized (bookings) { // emulates the UNIQUE(schedule_id, active_seat_id) index
                        if (bookings.stream().anyMatch(x -> x.getScheduleId() == b.getScheduleId() && x.getSeatId() == b.getSeatId() && x.getBookingStatus() != BookingStatus.CANCELLED)) throw new DuplicateKeyException("uq_bookings_active_seat");
                        b.setBookingId(bookingSeq.getAndIncrement()); bookings.add(b); }
                    yield b.getBookingId(); }
                case "updateBookingReference" -> { bookings.stream().filter(b -> b.getBookingId() == (Integer) args[0]).forEach(b -> b.setBookingReference((String) args[1])); yield null; }
                case "findById" -> bookings.stream().filter(b -> b.getBookingId() == (Integer) args[0]).findFirst().orElse(null);
                case "getAllBookings" -> new ArrayList<>(bookings);
                case "findPassengerBookings" -> { List<PassengerBookingDto> out = new ArrayList<>(); synchronized (bookings) { for (Booking b : bookings) if (b.getPassengerId() != null && b.getPassengerId() == (Integer) args[0]) { PassengerBookingDto d = new PassengerBookingDto(); d.setBookingId(b.getBookingId()); d.setBookingReference(b.getBookingReference()); out.add(d); } } yield out; }
                case "confirmIfPendingPayment" -> { Booking b = bookings.stream().filter(x -> x.getBookingId() == (Integer) args[0]).findFirst().get(); if (b.getBookingStatus() != BookingStatus.PENDING_PAYMENT) yield 0; b.setBookingStatus(BookingStatus.CONFIRMED); yield 1; }
                default -> null; });
        }

        @Bean PaymentDao paymentDao() {
            return fake(PaymentDao.class, (p, m, args) -> switch (m.getName()) {
                case "findById" -> payments.get((Integer) args[0]);
                case "findByBookingId" -> payments.values().stream().filter(x -> x.getBookingId() == (Integer) args[0]).findFirst().orElse(null);
                case "findDetailByBookingId" -> payments.values().stream().filter(x -> x.getBookingId() == (Integer) args[0]).findFirst().map(x -> { PaymentDetailDto d = new PaymentDetailDto(); d.setPaymentId(x.getPaymentId()); d.setPassengerId(x.getPassengerId()); return d; }).orElse(null);
                case "findDetailById" -> { Payment x = payments.get((Integer) args[0]); PaymentDetailDto d = new PaymentDetailDto(); d.setPaymentId(x.getPaymentId()); d.setPaymentStatus(x.getPaymentStatus().name()); yield d; }
                case "markVerified" -> { Payment x = payments.get((Integer) args[0]); if (x.getPaymentStatus() != PaymentStatus.PENDING_VERIFICATION) yield 0; x.setPaymentStatus(PaymentStatus.VERIFIED); yield 1; }
                case "markRejected" -> { Payment x = payments.get((Integer) args[0]); if (x.getPaymentStatus() != PaymentStatus.PENDING_VERIFICATION) yield 0; x.setPaymentStatus(PaymentStatus.REJECTED); yield 1; }
                case "search" -> new PagedResultDto<PaymentDetailDto>(List.of(), 0, 20, 0, 0);
                case "findAudit" -> List.of();
                default -> null; });
        }
    }

    // ------------------------------------------------------------------ tiny HTTP + assertion helpers
    static final String SECRET = "harness-secret-harness-secret-1234567890";
    static final HttpClient http = HttpClient.newHttpClient();
    static String base;
    static int pass = 0, fail = 0;
    record Resp(int status, String body) {}

    static Resp call(String method, String path, String token, String json) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(base + path));
        if (token != null) b.header("Authorization", "Bearer " + token);
        HttpRequest.BodyPublisher bp = json == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json);
        if (json != null) b.header("Content-Type", "application/json");
        HttpResponse<String> r = http.send(b.method(method, bp).build(), HttpResponse.BodyHandlers.ofString());
        return new Resp(r.statusCode(), r.body());
    }
    static Resp multipart(String path, String token) throws Exception {
        String bd = "XBOUNDARY";
        String body = "--" + bd + "\r\nContent-Disposition: form-data; name=\"transactionReference\"\r\n\r\nTXN-1234\r\n--" + bd + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"s.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n\u00ff\u00d8\u00ff\r\n--" + bd + "--\r\n";
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(base + path)).header("Content-Type", "multipart/form-data; boundary=" + bd);
        if (token != null) b.header("Authorization", "Bearer " + token);
        HttpResponse<String> r = http.send(b.POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.ISO_8859_1)).build(), HttpResponse.BodyHandlers.ofString());
        return new Resp(r.statusCode(), r.body());
    }
    static void check(String name, boolean ok, String detail) { System.out.println((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "   <-- " + detail)); if (ok) pass++; else fail++; }
    static void status(String name, int expected, Resp r) { check(name + " -> " + expected, r.status == expected, "got " + r.status + " " + r.body.substring(0, Math.min(120, r.body.length()))); }
    static String tokenFrom(Resp r) { var m = java.util.regex.Pattern.compile("\"data\":\"([^\"]+)\"").matcher(r.body); return m.find() ? m.group(1) : null; }
    static String jwt(String sub, String role, Date exp, String secret) {
        return Jwts.builder().setSubject(sub).claim("role", role).setIssuedAt(new Date()).setExpiration(exp).signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))).compact();
    }

    public static int runAll() throws Exception {
        Map<String, Object> props = new HashMap<>();
        props.put("server.port", "18081");
        props.put("app.jwt.secret", SECRET);
        props.put("app.cors.allowed-origin", "http://localhost:5173");
        props.put("app.storage.payment-slips-dir", "/tmp/harness-slips");
        props.put("app.upload.max-bytes", "5242880");
        props.put("app.timezone", "Asia/Colombo");
        props.put("spring.autoconfigure.exclude", String.join(",",
                "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
                "org.springframework.boot.jdbc.autoconfigure.DataSourceTransactionManagerAutoConfiguration",
                "org.springframework.boot.jdbc.autoconfigure.JdbcTemplateAutoConfiguration",
                "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration",
                "org.springframework.boot.data.jpa.autoconfigure.DataJpaRepositoriesAutoConfiguration"));
        SpringApplication app = new SpringApplication(App.class);
        app.setDefaultProperties(props);
        ConfigurableApplicationContext ctx = app.run("--server.port=0", "--server.servlet.context-path=", "--spring.profiles.active=test", "--app.demo.enabled=false", "--app.jwt.secret=" + SECRET);
        base = "http://localhost:" + ctx.getEnvironment().getProperty("local.server.port");

        String T = TRAVEL.toString();

        System.out.println("== PUBLIC ACCESS (no token)");
        status("GET /api/routes", 200, call("GET", "/api/routes", null, null));
        status("GET /api/buses/1", 200, call("GET", "/api/buses/1", null, null));
        status("GET /api/schedules/all", 200, call("GET", "/api/schedules/all", null, null));
        status("GET /api/schedules/search", 200, call("GET", "/api/schedules/search?source=Colombo&destination=Kandy&date=" + T, null, null));
        status("GET /api/seats/1 (bus layout)", 200, call("GET", "/api/seats/1", null, null));
        status("GET /api/seats/schedule/1 (availability)", 200, call("GET", "/api/seats/schedule/1", null, null));
        String forbidden = "(?i)passengerName|phoneNumber|\"email\"|bookingReference|transaction|slip|password|token|passengerId|bookingId";
        for (String path : List.of("/api/routes", "/api/buses/1", "/api/schedules/all", "/api/schedules/search?source=Colombo&destination=Kandy&date=" + T, "/api/seats/1", "/api/seats/schedule/1")) {
            Resp r = call("GET", path, null, null);
            check("no private fields in public response " + path.split("\\?")[0], !java.util.regex.Pattern.compile(forbidden).matcher(r.body).find(), r.body.substring(0, Math.min(150, r.body.length())));
        }
        status("public GET still works with an INVALID token present", 200, call("GET", "/api/routes", "garbage.token.value", null));
        status("search with past date is rejected (400) not leaked", 400, call("GET", "/api/schedules/search?source=Colombo&destination=Kandy&date=2020-01-01", null, null));

        System.out.println("== REGISTER / LOGIN");
        status("register passenger alice", 201, call("POST", "/api/passengers/register", null, "{\"passengerName\":\"Alice\",\"email\":\"alice@x.com\",\"phoneNumber\":\"0771234567\",\"password\":\"password123\"}"));
        call("POST", "/api/passengers/register", null, "{\"passengerName\":\"Bob\",\"email\":\"bob@x.com\",\"phoneNumber\":\"0779999999\",\"password\":\"password123\"}");
        Resp la = call("POST", "/api/passengers/login", null, "{\"email\":\"alice@x.com\",\"password\":\"password123\"}");
        status("passenger login ok", 200, la);
        String alice = tokenFrom(la);
        String bob = tokenFrom(call("POST", "/api/passengers/login", null, "{\"email\":\"bob@x.com\",\"password\":\"password123\"}"));
        status("passenger login wrong password", 401, call("POST", "/api/passengers/login", null, "{\"email\":\"alice@x.com\",\"password\":\"nope\"}"));
        Resp ad = call("POST", "/api/admin/login", null, "{\"username\":\"admin\",\"password\":\"admin123\"}");
        status("admin login ok", 200, ad);
        String admin = tokenFrom(ad);
        status("anonymous -> admin schedule history", 401, call("GET", "/api/admin/schedules", null, null));
        status("passenger -> admin schedule history", 403, call("GET", "/api/admin/schedules", alice, null));
        status("admin -> admin schedule history", 200, call("GET", "/api/admin/schedules", admin, null));
        status("admin login wrong password", 401, call("POST", "/api/admin/login", null, "{\"username\":\"admin\",\"password\":\"x\"}"));
        System.out.println("== SHARED LOGIN AND BUS OWNER ACCESS");
        Resp ownerLogin = call("POST", "/api/auth/login", null, "{\"username\":\"owner1\",\"password\":\"Owner12345\"}");
        status("owner shared login", 200, ownerLogin);
        check("server returns owner role", ownerLogin.body.contains("BUS_OWNER"), ownerLogin.body);
        String owner = jwt("owner1", "BUS_OWNER", new Date(System.currentTimeMillis()+600000), SECRET);
        status("admin shared login", 200, call("POST", "/api/auth/login", null, "{\"username\":\"admin\",\"password\":\"admin123\"}"));
        status("passenger shared login", 200, call("POST", "/api/auth/login", null, "{\"username\":\"alice@x.com\",\"password\":\"password123\"}"));
        status("wrong owner password", 401, call("POST", "/api/auth/login", null, "{\"username\":\"owner1\",\"password\":\"wrong\"}"));
        status("anonymous owner access", 401, call("GET", "/api/owner/buses", null, null));
        status("passenger owner access", 403, call("GET", "/api/owner/buses", alice, null));
        status("owner fleet", 200, call("GET", "/api/owner/buses", owner, null));
        status("owner cannot access admin reservations", 403, call("GET", "/api/admin/bookings", owner, null));
        status("owner cannot access owner administration", 403, call("GET", "/api/admin/owners", owner, null));
        status("owner cannot book as passenger", 403, call("POST", "/api/bookings", owner, "{}"));
        status("owner cannot add unrestricted schedule", 403, call("POST", "/api/schedules/add", owner, "{}"));
        status("admin manages owners", 200, call("GET", "/api/admin/owners", admin, null));
        status("passenger cannot manage owners", 403, call("GET", "/api/admin/owners", alice, null));
        ownerActive = false;
        status("disabled owner token stops working", 401, call("GET", "/api/owner/buses", owner, null));
        status("disabled owner cannot sign in", 401, call("POST", "/api/auth/login", null, "{\"username\":\"owner1\",\"password\":\"Owner12345\"}"));
        ownerActive = true;
        status("owner cannot approve owner access", 403, call("POST", "/api/admin/owners/1/approval", owner, "{\"decision\":\"APPROVED\"}"));
        status("passenger cannot approve owner access", 403, call("POST", "/api/admin/owners/1/approval", alice, "{\"decision\":\"APPROVED\"}"));
        status("anonymous cannot approve owner access", 401, call("POST", "/api/admin/owners/1/approval", null, "{\"decision\":\"APPROVED\"}"));
        ownerApprovalStatus="PENDING";
        Resp pendingLogin = call("POST", "/api/auth/login", null, "{\"username\":\"owner1\",\"password\":\"Owner12345\"}");
        status("pending owner cannot sign in", 403, pendingLogin);
        check("pending login explains admin approval and returns no token", pendingLogin.body.contains("awaiting admin approval") && !pendingLogin.body.contains("\"token\""),pendingLogin.body);
        status("pending owner old token cannot access fleet", 401, call("GET", "/api/owner/buses", owner, null));
        status("approval needs identity verification confirmation", 400, call("POST", "/api/admin/owners/1/approval", admin, "{\"decision\":\"APPROVED\",\"reason\":\"Documents checked\"}"));
        status("admin approves owner access", 200, call("POST", "/api/admin/owners/1/approval", admin, "{\"decision\":\"APPROVED\",\"reason\":\"Original documents checked\",\"identityVerified\":true,\"adminId\":999}"));
        check("review actor comes from admin token", reviewingAdminId == 1, String.valueOf(reviewingAdminId));
        status("approved owner can sign in", 200, call("POST", "/api/auth/login", null, "{\"username\":\"owner1\",\"password\":\"Owner12345\"}"));
        status("admin rejection requires a reason", 400, call("POST", "/api/admin/owners/1/approval", admin, "{\"decision\":\"REJECTED\"}"));
        status("admin revokes approval", 200, call("POST", "/api/admin/owners/1/approval", admin, "{\"decision\":\"REJECTED\",\"reason\":\"Documents require review\"}"));
        status("revoked owner cannot sign in", 403, call("POST", "/api/auth/login", null, "{\"username\":\"owner1\",\"password\":\"Owner12345\"}"));
        status("revoked token cannot access dashboard", 401, call("GET", "/api/owner/buses", owner, null));
        status("revoked token cannot add departures", 401, call("POST", "/api/owner/schedules", owner, "{}"));
        Resp ownerRequest = call("POST", "/api/owner-requests", null, "{\"username\":\"requester\",\"fullName\":\"Owner Applicant\",\"phoneNumber\":\"0771234567\",\"password\":\"Owner12345\",\"verificationDetails\":\"Test Operator; bus ABC-1234; registration REG-1\",\"approvalStatus\":\"APPROVED\",\"role\":\"ADMIN\",\"busIds\":[1]}");
        status("public owner request accepted for review", 201, ownerRequest);
        check("owner application returns no token", !ownerRequest.body.contains("\"token\""),ownerRequest.body);
        status("anonymous cannot list owner applications", 401, call("GET", "/api/owner-requests", null, null));
        ownerApprovalStatus="APPROVED";

        System.out.println("== ANONYMOUS cannot reach private or write operations");
        String bookJson = "{\"scheduleId\":1,\"seatId\":101,\"passengerName\":\"Alice\",\"phoneNumber\":\"0771234567\"}";
        int before = bookings.size();
        status("anonymous POST /api/bookings", 401, call("POST", "/api/bookings", null, bookJson));
        status("anonymous GET /api/passenger/bookings", 401, call("GET", "/api/passenger/bookings", null, null));
        status("anonymous GET payment record", 401, call("GET", "/api/passenger/bookings/1/payment", null, null));
        status("anonymous GET payment slip", 401, call("GET", "/api/passenger/bookings/1/payment/slip", null, null));
        status("anonymous slip upload", 401, multipart("/api/passenger/bookings/1/payment", null));
        status("anonymous GET /api/admin/payments", 401, call("GET", "/api/admin/payments", null, null));
        status("anonymous GET /api/admin/bookings", 401, call("GET", "/api/admin/bookings", null, null));
        status("anonymous POST /api/schedules/add", 401, call("POST", "/api/schedules/add", null, "{}"));
        for (String m : List.of("POST", "PUT", "PATCH", "DELETE")) {
            status("anonymous " + m + " /api/routes (not a public write)", 401, call(m, "/api/routes", null, "{}"));
            status("anonymous " + m + " /api/seats/1", 401, call(m, "/api/seats/1", null, "{}"));
            status("anonymous " + m + " /api/bookings/1", 401, call(m, "/api/bookings/1", null, "{}"));
        }
        status("anonymous GET unknown /api/anything (default deny)", 401, call("GET", "/api/anything", null, null));
        check("no booking row created by anonymous attempts or by browsing seats", bookings.size() == before, "bookings=" + bookings.size());

        System.out.println("== INVALID / EXPIRED / FORGED TOKENS on protected resources");
        status("expired token", 401, call("GET", "/api/passenger/bookings", jwt("alice@x.com", "PASSENGER", new Date(System.currentTimeMillis() - 60000), SECRET), null));
        status("token signed with wrong key", 401, call("GET", "/api/passenger/bookings", jwt("alice@x.com", "PASSENGER", new Date(System.currentTimeMillis() + 600000), "another-secret-another-secret-1234567890"), null));
        status("malformed token", 401, call("GET", "/api/passenger/bookings", "abc.def.ghi", null));
        status("valid signature but unknown user", 401, call("GET", "/api/passenger/bookings", jwt("ghost@x.com", "PASSENGER", new Date(System.currentTimeMillis() + 600000), SECRET), null));
        status("valid passenger token claiming ADMIN role name for passenger subject", 401, call("GET", "/api/admin/payments", jwt("alice@x.com", "ADMIN", new Date(System.currentTimeMillis() + 600000), SECRET), null));

        System.out.println("== ROLE SEPARATION");
        status("passenger -> /api/admin/payments", 403, call("GET", "/api/admin/payments", alice, null));
        status("passenger -> /api/admin/bookings", 403, call("GET", "/api/admin/bookings", alice, null));
        status("passenger -> POST /api/schedules/add", 403, call("POST", "/api/schedules/add", alice, "{}"));
        status("admin -> /api/admin/payments", 200, call("GET", "/api/admin/payments", admin, null));
        status("admin -> /api/admin/bookings", 200, call("GET", "/api/admin/bookings", admin, null));
        status("admin -> passenger private bookings", 403, call("GET", "/api/passenger/bookings", admin, null));
        status("admin -> create booking as passenger", 403, call("POST", "/api/bookings", admin, bookJson));

        System.out.println("== BOOKING INTEGRITY");
        String spoof = "{\"scheduleId\":1,\"seatId\":101,\"passengerName\":\"Alice\",\"phoneNumber\":\"0771234567\",\"passengerId\":999,\"role\":\"ADMIN\"}";
        Resp b1 = call("POST", "/api/bookings", alice, spoof);
        status("passenger books available seat", 201, b1);
        check("booking owner comes from token (not body passengerId 999)", bookings.size() == before + 1 && bookings.get(bookings.size() - 1).getPassengerId() == passengers.get("alice@x.com").getPassengerId(), String.valueOf(bookings));
        check("booking starts PENDING_PAYMENT with server price", bookings.get(bookings.size() - 1).getBookingStatus() == BookingStatus.PENDING_PAYMENT && bookings.get(bookings.size() - 1).getAmount().compareTo(new BigDecimal("1500")) == 0, "");
        status("same seat again by bob is a conflict", 409, call("POST", "/api/bookings", bob, bookJson));
        Resp seats = call("GET", "/api/seats/schedule/1", null, null);
        check("public seat map now shows seat 101 as booked", seats.body.contains("{\"booked\":true,\"busId\":1,\"seatId\":101,"), seats.body.substring(0, 160));
        status("seat of a different bus is rejected", 400, call("POST", "/api/bookings", bob, "{\"scheduleId\":1,\"seatId\":205,\"passengerName\":\"Bob\",\"phoneNumber\":\"0779999999\"}"));
        status("unknown schedule is rejected", 404, call("POST", "/api/bookings", bob, "{\"scheduleId\":77,\"seatId\":101,\"passengerName\":\"Bob\",\"phoneNumber\":\"0779999999\"}"));
        status("missing passenger name is rejected", 400, call("POST", "/api/bookings", bob, "{\"scheduleId\":1,\"seatId\":102,\"phoneNumber\":\"0779999999\"}"));

        ExecutorService pool = Executors.newFixedThreadPool(8);
        List<Future<Integer>> fs = new ArrayList<>();
        for (int i = 0; i < 8; i++) { final String t = i % 2 == 0 ? alice : bob; fs.add(pool.submit(() -> call("POST", "/api/bookings", t, "{\"scheduleId\":1,\"seatId\":103,\"passengerName\":\"X Y\",\"phoneNumber\":\"0771111111\"}").status)); }
        int ok = 0, conflict = 0; for (Future<Integer> f : fs) { int s = f.get(); if (s == 201) ok++; else if (s == 409) conflict++; }
        pool.shutdown();
        check("8 concurrent requests for one seat -> exactly 1 booking, 7 conflicts", ok == 1 && conflict == 7, "ok=" + ok + " conflict=" + conflict);

        System.out.println("== PRIVACY BETWEEN PASSENGERS");
        Resp hist = call("GET", "/api/passenger/bookings", bob, null);
        check("bob's history contains only bob's rows (not alice's REF)", !hist.body.contains("REF0001"), hist.body);
        Resp hA = call("GET", "/api/passenger/bookings", alice, null);
        check("alice sees her own booking", hA.body.contains("REF0001"), hA.body);
        // payment owned by alice
        Payment pay = new Payment(); pay.setPaymentId(1); pay.setBookingId(1); pay.setPassengerId(passengers.get("alice@x.com").getPassengerId()); pay.setPaymentStatus(PaymentStatus.PENDING_VERIFICATION); pay.setSlipStoredName("00000000-0000-0000-0000-000000000000.jpg"); pay.setSlipContentType("image/jpeg"); pay.setPaymentReference("PAYTEST"); payments.put(1, pay);
        status("bob cannot read alice's payment record", 404, call("GET", "/api/passenger/bookings/1/payment", bob, null));
        status("bob cannot read alice's payment slip", 404, call("GET", "/api/passenger/bookings/1/payment/slip", bob, null));
        status("bob cannot upload a slip to alice's booking", 404, multipart("/api/passenger/bookings/1/payment", bob));
        status("alice can read her own payment record", 200, call("GET", "/api/passenger/bookings/1/payment", alice, null));

        System.out.println("== PAYMENT VERIFICATION still follows business rules");
        status("passenger cannot approve", 403, call("POST", "/api/admin/payments/1/approve", alice, null));
        status("admin approves pending payment", 200, call("POST", "/api/admin/payments/1/approve", admin, null));
        check("booking became CONFIRMED", bookings.get(0).getBookingStatus() == BookingStatus.CONFIRMED, String.valueOf(bookings.get(0).getBookingStatus()));
        status("second approval is a conflict", 409, call("POST", "/api/admin/payments/1/approve", admin, null));
        status("reject after approval is a conflict", 409, call("POST", "/api/admin/payments/1/reject", admin, "{\"reason\":\"changed my mind\"}"));

        System.out.println("== CORS");
        HttpResponse<String> pre = http.send(HttpRequest.newBuilder(URI.create(base + "/api/bookings")).header("Origin", "http://localhost:5173").header("Access-Control-Request-Method", "POST").header("Access-Control-Request-Headers", "authorization,content-type").method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        check("preflight from the configured frontend origin is allowed", pre.statusCode() == 200 && "http://localhost:5173".equals(pre.headers().firstValue("Access-Control-Allow-Origin").orElse("")), pre.statusCode() + " " + pre.headers().map());
        HttpResponse<String> bad = http.send(HttpRequest.newBuilder(URI.create(base + "/api/bookings")).header("Origin", "http://evil.example").header("Access-Control-Request-Method", "POST").method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        check("preflight from another origin is refused", bad.statusCode() == 403, String.valueOf(bad.statusCode()));
        HttpResponse<String> del = http.send(HttpRequest.newBuilder(URI.create(base + "/api/bookings")).header("Origin", "http://localhost:5173").header("Access-Control-Request-Method", "DELETE").method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        check("DELETE is not offered via CORS", del.statusCode() == 403, String.valueOf(del.statusCode()));
        HttpResponse<String> put = http.send(HttpRequest.newBuilder(URI.create(base + "/api/admin/owners/1")).header("Origin", "http://localhost:5173").header("Access-Control-Request-Method", "PUT").header("Access-Control-Request-Headers", "authorization,content-type").method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        check("owner-management PUT preflight is allowed", put.statusCode() == 200, String.valueOf(put.statusCode()));

        System.out.println("\n" + pass + " passed, " + fail + " failed");
        ctx.close();
        return fail;
    }
}
