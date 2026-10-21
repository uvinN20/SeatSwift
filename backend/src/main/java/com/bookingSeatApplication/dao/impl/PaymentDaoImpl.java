package com.bookingSeatApplication.dao.impl;

import com.bookingSeatApplication.dao.PaymentDao;
import com.bookingSeatApplication.dto.PagedResultDto;
import com.bookingSeatApplication.dto.PaymentAuditDto;
import com.bookingSeatApplication.dto.PaymentDetailDto;
import com.bookingSeatApplication.model.Payment;
import com.bookingSeatApplication.model.PaymentStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Repository
public class PaymentDaoImpl implements PaymentDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static LocalDateTime ts(ResultSet rs, String col) throws SQLException {
        Timestamp t = rs.getTimestamp(col);
        return t == null ? null : t.toLocalDateTime();
    }

    private static final RowMapper<Payment> PAYMENT_MAPPER = (rs, n) -> {
        Payment p = new Payment();
        p.setPaymentId(rs.getInt("payment_id"));
        p.setPaymentReference(rs.getString("payment_reference"));
        p.setBookingId(rs.getInt("booking_id"));
        p.setPassengerId(rs.getInt("passenger_id"));
        p.setAmount(rs.getBigDecimal("amount"));
        p.setTransactionReference(rs.getString("transaction_reference"));
        p.setPaymentMethod(rs.getString("payment_method"));
        p.setSlipStoredName(rs.getString("slip_stored_name"));
        p.setSlipOriginalName(rs.getString("slip_original_name"));
        p.setSlipContentType(rs.getString("slip_content_type"));
        p.setSlipSizeBytes(rs.getLong("slip_size_bytes"));
        p.setSlipSha256(rs.getString("slip_sha256"));
        p.setPaymentStatus(PaymentStatus.valueOf(rs.getString("payment_status")));
        p.setUploadedAt(ts(rs, "uploaded_at"));
        int verifiedBy = rs.getInt("verified_by");
        p.setVerifiedBy(rs.wasNull() ? null : verifiedBy);
        p.setVerifiedAt(ts(rs, "verified_at"));
        p.setRejectionReason(rs.getString("rejection_reason"));
        p.setResubmissionCount(rs.getInt("resubmission_count"));
        return p;
    };

    private static final String DETAIL_SELECT =
            "SELECT p.payment_id, p.payment_reference, p.payment_status, p.amount, p.transaction_reference, " +
            "p.payment_method, p.slip_content_type, p.uploaded_at, au.username AS verified_by_username, " +
            "p.verified_at, p.rejection_reason, p.resubmission_count, " +
            "b.booking_id, b.booking_reference, b.booking_status, " +
            "pa.passenger_id, pa.passenger_name, pa.email, pa.phone_number, " +
            "s.schedule_id, s.bus_id, s.route_id, r.source, r.destination, s.travel_date, s.departure_time, " +
            "st.seat_number, " +
            "(SELECT COUNT(*) FROM payments p2 WHERE p2.transaction_reference = p.transaction_reference " +
            "   AND p2.payment_id <> p.payment_id) AS txn_reuse, " +
            "(SELECT COUNT(*) FROM payments p3 WHERE p3.slip_sha256 = p.slip_sha256 " +
            "   AND p3.payment_id <> p.payment_id) AS slip_reuse ";

    private static final String DETAIL_FROM =
            "FROM payments p " +
            "JOIN bookings b ON b.booking_id = p.booking_id " +
            "JOIN passengers pa ON pa.passenger_id = p.passenger_id " +
            "JOIN schedules s ON s.schedule_id = b.schedule_id " +
            "JOIN routes r ON r.route_id = s.route_id " +
            "JOIN seats st ON st.seat_id = b.seat_id " +
            "LEFT JOIN admin_users au ON au.admin_id = p.verified_by ";

    private static final RowMapper<PaymentDetailDto> DETAIL_MAPPER = (rs, n) -> {
        PaymentDetailDto d = new PaymentDetailDto();
        d.setPaymentId(rs.getInt("payment_id"));
        d.setPaymentReference(rs.getString("payment_reference"));
        d.setPaymentStatus(rs.getString("payment_status"));
        d.setAmount(rs.getBigDecimal("amount"));
        d.setTransactionReference(rs.getString("transaction_reference"));
        d.setPaymentMethod(rs.getString("payment_method"));
        d.setSlipContentType(rs.getString("slip_content_type"));
        d.setUploadedAt(ts(rs, "uploaded_at"));
        d.setVerifiedByUsername(rs.getString("verified_by_username"));
        d.setVerifiedAt(ts(rs, "verified_at"));
        d.setRejectionReason(rs.getString("rejection_reason"));
        d.setResubmissionCount(rs.getInt("resubmission_count"));
        d.setTransactionReferenceReuseCount(rs.getInt("txn_reuse"));
        d.setSlipReuseCount(rs.getInt("slip_reuse"));
        d.setBookingId(rs.getInt("booking_id"));
        d.setBookingReference(rs.getString("booking_reference"));
        d.setBookingStatus(rs.getString("booking_status"));
        d.setPassengerId(rs.getInt("passenger_id"));
        d.setPassengerName(rs.getString("passenger_name"));
        d.setPassengerEmail(rs.getString("email"));
        d.setPassengerPhone(rs.getString("phone_number"));
        d.setScheduleId(rs.getInt("schedule_id"));
        d.setBusId(rs.getInt("bus_id"));
        d.setRouteId(rs.getInt("route_id"));
        d.setRouteSource(rs.getString("source"));
        d.setRouteDestination(rs.getString("destination"));
        d.setTravelDate(rs.getDate("travel_date").toLocalDate());
        d.setDepartureTime(rs.getTime("departure_time").toLocalTime());
        d.setSeatNumber(rs.getString("seat_number"));
        return d;
    };

    @Override
    public int insert(Payment p) {

        String sql = "INSERT INTO payments (payment_reference, booking_id, passenger_id, amount, transaction_reference, " +
                "payment_method, slip_stored_name, slip_original_name, slip_content_type, slip_size_bytes, slip_sha256, " +
                "payment_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";

        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"payment_id"});
            ps.setString(1, p.getPaymentReference());
            ps.setInt(2, p.getBookingId());
            ps.setInt(3, p.getPassengerId());
            ps.setBigDecimal(4, p.getAmount());
            ps.setString(5, p.getTransactionReference());
            ps.setString(6, p.getPaymentMethod());
            ps.setString(7, p.getSlipStoredName());
            ps.setString(8, p.getSlipOriginalName());
            ps.setString(9, p.getSlipContentType());
            ps.setLong(10, p.getSlipSizeBytes());
            ps.setString(11, p.getSlipSha256());
            ps.setString(12, PaymentStatus.PENDING_VERIFICATION.name());
            return ps;
        }, keys);
        return keys.getKey().intValue();
    }

    @Override
    public int resubmit(Payment p) {
        return jdbcTemplate.update(
                "UPDATE payments SET transaction_reference = ?, slip_stored_name = ?, slip_original_name = ?, " +
                "slip_content_type = ?, slip_size_bytes = ?, slip_sha256 = ?, payment_status = 'PENDING_VERIFICATION', " +
                "uploaded_at = CURRENT_TIMESTAMP, verified_by = NULL, verified_at = NULL, rejection_reason = NULL, " +
                "resubmission_count = resubmission_count + 1 " +
                "WHERE payment_id = ? AND payment_status = 'REJECTED'",
                p.getTransactionReference(), p.getSlipStoredName(), p.getSlipOriginalName(), p.getSlipContentType(),
                p.getSlipSizeBytes(), p.getSlipSha256(), p.getPaymentId());
    }

    @Override
    public Payment findById(int paymentId) {
        List<Payment> r = jdbcTemplate.query("SELECT * FROM payments WHERE payment_id = ?", PAYMENT_MAPPER, paymentId);
        return r.isEmpty() ? null : r.get(0);
    }

    @Override
    public Payment findByBookingId(int bookingId) {
        List<Payment> r = jdbcTemplate.query("SELECT * FROM payments WHERE booking_id = ?", PAYMENT_MAPPER, bookingId);
        return r.isEmpty() ? null : r.get(0);
    }

    @Override
    public int markVerified(int paymentId, int adminId) {
        return jdbcTemplate.update(
                "UPDATE payments SET payment_status = 'VERIFIED', verified_by = ?, verified_at = CURRENT_TIMESTAMP, " +
                "rejection_reason = NULL WHERE payment_id = ? AND payment_status = 'PENDING_VERIFICATION'",
                adminId, paymentId);
    }

    @Override
    public int markRejected(int paymentId, int adminId, String reason) {
        return jdbcTemplate.update(
                "UPDATE payments SET payment_status = 'REJECTED', verified_by = ?, verified_at = CURRENT_TIMESTAMP, " +
                "rejection_reason = ? WHERE payment_id = ? AND payment_status = 'PENDING_VERIFICATION'",
                adminId, reason, paymentId);
    }

    @Override
    public PaymentDetailDto findDetailById(int paymentId) {
        List<PaymentDetailDto> r = jdbcTemplate.query(DETAIL_SELECT + DETAIL_FROM + "WHERE p.payment_id = ?",
                DETAIL_MAPPER, paymentId);
        return r.isEmpty() ? null : r.get(0);
    }

    @Override
    public PaymentDetailDto findDetailByBookingId(int bookingId) {
        List<PaymentDetailDto> r = jdbcTemplate.query(DETAIL_SELECT + DETAIL_FROM + "WHERE p.booking_id = ?",
                DETAIL_MAPPER, bookingId);
        return r.isEmpty() ? null : r.get(0);
    }

    @Override
    public PagedResultDto<PaymentDetailDto> search(String status, String query, LocalDate travelDate,
                                                   LocalDate uploadedFrom, LocalDate uploadedTo, int page, int size) {

        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        List<Object> args = new ArrayList<>();

        if (status != null) {
            where.append("AND p.payment_status = ? ");
            args.add(status);
        }
        if (query != null && !query.isBlank()) {
            String like = "%" + query.trim().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            where.append("AND (p.payment_reference LIKE ? OR b.booking_reference LIKE ? OR pa.passenger_name LIKE ? " +
                    "OR pa.email LIKE ? OR r.source LIKE ? OR r.destination LIKE ? " +
                    "OR CAST(s.bus_id AS CHAR) LIKE ? OR p.transaction_reference LIKE ?) ");
            for (int i = 0; i < 8; i++) args.add(like);
        }
        if (travelDate != null) {
            where.append("AND s.travel_date = ? ");
            args.add(java.sql.Date.valueOf(travelDate));
        }
        if (uploadedFrom != null) {
            where.append("AND p.uploaded_at >= ? ");
            args.add(Timestamp.valueOf(uploadedFrom.atStartOfDay()));
        }
        if (uploadedTo != null) {
            where.append("AND p.uploaded_at < ? ");
            args.add(Timestamp.valueOf(uploadedTo.plusDays(1).atStartOfDay()));
        }

        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) " + DETAIL_FROM + where, Long.class, args.toArray());
        long totalItems = total == null ? 0 : total;

        // oldest-first for the verification queue, newest-first for everything else
        String order = "PENDING_VERIFICATION".equals(status) ? "ASC" : "DESC";
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(size);
        pageArgs.add(page * size);

        List<PaymentDetailDto> items = jdbcTemplate.query(
                DETAIL_SELECT + DETAIL_FROM + where + "ORDER BY p.uploaded_at " + order + ", p.payment_id " + order +
                        " LIMIT ? OFFSET ?",
                DETAIL_MAPPER, pageArgs.toArray());

        int totalPages = (int) Math.ceil(totalItems / (double) size);
        return new PagedResultDto<>(items, page, size, totalItems, totalPages);
    }

    @Override
    public void insertAudit(int paymentId, String action, String fromStatus, String toStatus,
                            String actorType, int actorId, String note) {
        jdbcTemplate.update(
                "INSERT INTO payment_audit_log (payment_id, action, from_status, to_status, actor_type, actor_id, note) " +
                "VALUES (?,?,?,?,?,?,?)",
                paymentId, action, fromStatus, toStatus, actorType, actorId, note);
    }

    @Override
    public List<PaymentAuditDto> findAudit(int paymentId) {
        return jdbcTemplate.query(
                "SELECT audit_id, action, from_status, to_status, actor_type, actor_id, note, created_at " +
                "FROM payment_audit_log WHERE payment_id = ? ORDER BY audit_id",
                (rs, n) -> {
                    PaymentAuditDto a = new PaymentAuditDto();
                    a.setAuditId(rs.getLong("audit_id"));
                    a.setAction(rs.getString("action"));
                    a.setFromStatus(rs.getString("from_status"));
                    a.setToStatus(rs.getString("to_status"));
                    a.setActorType(rs.getString("actor_type"));
                    a.setActorId(rs.getInt("actor_id"));
                    a.setNote(rs.getString("note"));
                    a.setCreatedAt(ts(rs, "created_at"));
                    return a;
                }, paymentId);
    }
}
