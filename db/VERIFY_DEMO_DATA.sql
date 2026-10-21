USE bus_seat_booking_system;
-- Every demo route/day has eight departures and distinct buses/times.
SELECT r.source,r.destination,s.travel_date,COUNT(*) AS departures,
       COUNT(DISTINCT s.bus_id) AS buses,COUNT(DISTINCT s.departure_time) AS times
FROM demo_schedules d JOIN schedules s USING(schedule_id) JOIN routes r USING(route_id)
GROUP BY r.route_id,r.source,r.destination,s.travel_date ORDER BY s.travel_date,r.source,r.destination;
-- Initial occupancy is 8–10 confirmed demo passengers; real reservations can raise it later.
SELECT s.schedule_id,s.travel_date,s.departure_time,
       SUM(b.booking_reference LIKE 'DEMO-%' AND b.booking_status<>'CANCELLED') AS demo_occupied,
       SUM(b.booking_status<>'CANCELLED') AS total_occupied
FROM demo_schedules d JOIN schedules s USING(schedule_id) JOIN bookings b USING(schedule_id)
GROUP BY s.schedule_id,s.travel_date,s.departure_time ORDER BY s.schedule_id;
SELECT username FROM admin_users WHERE username='uvin';
SELECT email FROM passengers WHERE email LIKE 'demo-%@seatswift.example' ORDER BY passenger_id LIMIT 10;

-- Synthetic owner requests and simulated approvals (no passwords exposed).
SELECT o.username,o.full_name,o.approval_status,o.verification_details,
       a.username AS reviewed_by,o.reviewed_at,o.review_note,
       (SELECT COUNT(*) FROM bus_owners b WHERE b.owner_id=o.owner_id) AS assigned_buses
FROM owner_users o LEFT JOIN admin_users a ON a.admin_id=o.reviewed_by
WHERE o.username IN ('demo_owner_kandy','demo_owner_galle','demo_owner_matara','demo_owner_jaffna','demo_owner_ella');
SELECT o.username,a.decision,a.reason,a.reviewed_at
FROM owner_approval_audit a JOIN owner_users o ON o.owner_id=a.owner_id
WHERE a.reason LIKE 'DEMO ONLY:%';
