import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, InputNumber, Modal, Popconfirm, Select, Skeleton, Table, Tag, Tooltip, notification } from "antd";
import { Link, useNavigate } from "react-router-dom";
import Brand from "../../components/common/Brand";
import ThemeToggle from "../../components/ui/ThemeToggle";
import SeatMap from "../../components/booking/SeatMap";
import { createOwnerTrip, deleteOwnerTrip, getOwnerFleet, getOwnerTrip, getOwnerTrips, updateOwnerTrip, type FleetBus, type OwnerReservation, type OwnerTrip, type OwnerTripDetail } from "../../services/ownerService";
import { clearSession, getAccountName } from "../../utils/auth";
import { addDaysISO, formatLongDate, todayISO } from "../../utils/dates";
import { errorMessage, formatMoney, formatTime } from "../../utils/format";
import { ROUTES } from "../../types/routes";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [fleet, setFleet] = useState<FleetBus[]>([]);
  const [date, setDate] = useState(todayISO);
  const [trips, setTrips] = useState<OwnerTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [refresh, setRefresh] = useState(0);
  const [busFilter, setBusFilter] = useState<number>();
  const [detail, setDetail] = useState<OwnerTripDetail>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string>();
  const detailRequest = useRef(0);
  const [open, setOpen] = useState(false);
  const [newBus, setNewBus] = useState<number>();
  const [newDate, setNewDate] = useState(todayISO);
  const [newTime, setNewTime] = useState("");
  const [fare, setFare] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [editing, setEditing] = useState<OwnerTrip>();
  const [deletingId, setDeletingId] = useState<number>();
  useEffect(() => {
    let alive = true;
    const pending = detailRequest;
    const load = async () => {
      setLoading(true); setError(undefined); setTrips([]); setDetail(undefined); setDetailError(undefined); setDetailLoading(false);
      detailRequest.current++;
      try {
        const [buses, schedules] = await Promise.all([getOwnerFleet(), getOwnerTrips(date)]);
        if (alive) {
          setFleet(buses.data.data); setTrips(schedules.data.data);
          setBusFilter(current => buses.data.data.some(b => b.busId === current) ? current : undefined);
        }
      } catch (e) { const message = await errorMessage(e, "Could not load your fleet"); if (alive) setError(message); }
      finally { if (alive) setLoading(false); }
    };
    void load();
    return () => { alive = false; pending.current++; };
  }, [date, refresh]);
  const inspect = useCallback(async (id: number) => {
    const request = ++detailRequest.current;
    setDetailLoading(true); setDetailError(undefined); setDetail(undefined);
    try {
      const response = await getOwnerTrip(id);
      if (request === detailRequest.current) setDetail(response.data.data);
    } catch (e) {
      const message = await errorMessage(e, "Could not load this trip");
      if (request === detailRequest.current) setDetailError(message);
    } finally { if (request === detailRequest.current) setDetailLoading(false); }
  }, []);
  const save = async () => {
    if (!newBus || !newDate || !newTime || !fare) { setFormError("Choose a bus, date, departure time and positive fare."); return; }
    setSaving(true); setFormError(undefined);
    try {
      const payload = { busId: newBus, travelDate: newDate, departureTime: `${newTime}:00`, price: fare };
      if (editing) await updateOwnerTrip(editing.scheduleId, payload);
      else await createOwnerTrip(payload);
      notification.success({ title: editing ? "Departure updated" : "Departure added", description: editing ? "The departure details have been saved." : "Passengers can now find and book this trip." });
      setOpen(false); setDate(newDate); setRefresh(v => v + 1);
      setEditing(undefined);
    } catch (e) { setFormError(await errorMessage(e, editing ? "Could not update this departure" : "Could not add this departure")); }
    finally { setSaving(false); }
  };
  const edit = (trip: OwnerTrip) => {
    setEditing(trip); setNewBus(trip.busId); setNewDate(trip.travelDate); setNewTime(trip.departureTime.slice(0, 5));
    setFare(Number(trip.price)); setFormError(undefined); setOpen(true);
  };
  const remove = async (trip: OwnerTrip) => {
    setDeletingId(trip.scheduleId);
    try {
      await deleteOwnerTrip(trip.scheduleId);
      notification.success({ title: "Departure removed", description: "The unbooked departure was deleted." });
      setRefresh(v => v + 1);
    } catch (e) { notification.error({ title: "Could not remove departure", description: await errorMessage(e, "This departure could not be removed") }); }
    finally { setDeletingId(undefined); }
  };
  const visible = trips.filter(t => !busFilter || t.busId === busFilter);
  const booked = visible.reduce((n,t) => n + t.bookedSeats, 0);
  const capacity = visible.reduce((n,t) => n + t.totalSeats, 0);
  const value = visible.reduce((n,t) => n + Number(t.confirmedValue), 0);
  return <div className="sb-owner">
    <header className="sb-owner__header sb-container">
      <Brand to={ROUTES.OWNER_DASHBOARD} />
      <div className="sb-row"><ThemeToggle /><Link to={ROUTES.HOME}><Button>Booking site</Button></Link><Button onClick={() => { clearSession(); navigate(ROUTES.LOGIN, { replace: true }); }}>Log out</Button></div>
    </header>
    <main className="sb-container sb-section sb-stack">
      <section className="sb-card sb-owner__welcome">
        <div><span className="sb-owner__eyebrow">OWNER WORKSPACE</span><h1>Your fleet, in one place.</h1><p className="sb-muted">Welcome, {getAccountName()}. Track departures, seats and passenger bookings for your assigned buses.</p></div>
        <Button type="primary" size="large" disabled={!fleet.length || loading} onClick={() => { setNewBus(fleet[0]?.busId); setNewDate(date < todayISO() ? todayISO() : date); setNewTime(""); setFare(null); setFormError(undefined); setOpen(true); }}>Add departure</Button>
      </section>
      <section className="sb-owner__stats" aria-label="Selected date summary">
        {[{ label: "Assigned buses", value: fleet.length }, { label: "Departures on this date", value: visible.length }, { label: "Occupied / total seats", value: `${booked} / ${capacity}` }, { label: "Confirmed ticket value", value: formatMoney(value) }].map(item => <div className="sb-card sb-owner__stat" key={item.label}><span className="sb-muted">{item.label}</span><strong>{item.value}</strong></div>)}
      </section>
      <section className="sb-card sb-owner__trips">
        <div className="sb-toolbar" style={{ justifyContent: "space-between" }}>
          <div><h2>Departure board</h2><p className="sb-muted">{formatLongDate(date)} · All times in Sri Lanka</p></div>
          <Button loading={loading} onClick={() => setRefresh(v => v + 1)}>Refresh</Button>
        </div>
        <div className="sb-owner__filters">
          <div className="sb-field"><label htmlFor="owner-travel-date">Travel date</label><input id="owner-travel-date" className="sb-input" type="date" value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></div>
          <div className="sb-field"><label htmlFor="owner-filter">Bus</label><Select id="owner-filter" allowClear placeholder="All assigned buses" value={busFilter} onChange={setBusFilter} options={fleet.map(b => ({ value: b.busId, label: `#${b.busId} · ${b.source} → ${b.destination}` }))} /></div>
          <div className="sb-row">{["Today", "Tomorrow", "Day after tomorrow"].map((label,i) => <Button key={label} type={date === addDaysISO(todayISO(),i) ? "primary" : "default"} onClick={() => setDate(addDaysISO(todayISO(),i))}>{label}</Button>)}</div>
        </div>
        {error && <Alert type="error" title={error} showIcon />}
        <Table<OwnerTrip> rowKey="scheduleId" loading={loading} dataSource={error ? [] : visible} scroll={{ x: 800 }} pagination={{ pageSize: 8, showSizeChanger: false }} locale={{ emptyText: fleet.length ? "No departures for this date. Add a departure or choose another date." : "No buses assigned yet. Ask your administrator to assign your buses." }} columns={[
          { title: "Departure", render: (_,t) => <strong>{formatTime(t.departureTime)}</strong> },
          { title: "Route / bus", render: (_,t) => <><span>{t.source} → {t.destination}</span><div className="sb-muted">Bus #{t.busId} · Trip #{t.scheduleId}</div></> },
          { title: "Occupancy", render: (_,t) => <><strong>{t.bookedSeats} / {t.totalSeats}</strong><div className="sb-owner__meter"><span style={{ width: `${t.totalSeats ? t.bookedSeats / t.totalSeats * 100 : 0}%` }} /></div></> },
          { title: "Confirmed", dataIndex: "confirmedSeats" },
          { title: "Pending payment", render: (_,t) => t.bookedSeats - t.confirmedSeats },
          { title: "Fare", render: (_,t) => formatMoney(t.price) },
          { title: "Actions", render: (_,t) => <div className="sb-row">
            <Button onClick={() => void inspect(t.scheduleId)}>View seats & bookings</Button>
            <Tooltip title={t.bookedSeats ? "Departures with booking history are locked to protect passenger tickets." : undefined}>
              <Button disabled={t.bookedSeats > 0} onClick={() => edit(t)}>Edit</Button>
            </Tooltip>
            <Tooltip title={t.bookedSeats ? "Departures with booking history cannot be deleted." : undefined}>
              <span><Popconfirm title="Delete this departure?" description="Only departures with no booking history can be removed." okText="Delete departure" cancelText="Keep departure" okButtonProps={{ danger: true }} onConfirm={() => void remove(t)}>
                <Button danger loading={deletingId === t.scheduleId} disabled={t.bookedSeats > 0 || deletingId !== undefined}>Delete</Button>
              </Popconfirm></span>
            </Tooltip>
          </div> },
        ]} />
      </section>
      {(detailLoading || detail || detailError) && <section className="sb-card sb-owner__trips" aria-live="polite">
        {detailLoading && <Skeleton active paragraph={{ rows: 8 }} />}
        {detailError && <Alert type="error" title={detailError} />}
        {detail && <>
          <div className="sb-toolbar" style={{ justifyContent: "space-between" }}><div><h2>{detail.trip.source} → {detail.trip.destination}</h2><p className="sb-muted">Bus #{detail.trip.busId} · {formatLongDate(detail.trip.travelDate)} · {formatTime(detail.trip.departureTime)}</p></div><Button onClick={() => void inspect(detail.trip.scheduleId)}>Refresh seat map</Button></div>
          <div className="sb-owner__detail">
            <div><h3>Seat arrangement</h3><p className="sb-muted">Occupancy for this departure. Cancelled bookings release their seats.</p><SeatMap readOnly seats={detail.seats} selectedIds={[]} maxSeats={0} onToggle={() => {}} onLimit={() => {}} /></div>
            <div className="sb-owner__manifest"><h3>Passenger bookings</h3><p className="sb-muted">Passenger details are shown for operating this trip. Payment verification is handled by the administrator.</p><Table<OwnerReservation> rowKey="bookingId" dataSource={detail.reservations} scroll={{ x: 600 }} pagination={{ pageSize: 10, showSizeChanger: false }} columns={[
              { title: "Seat", dataIndex: "seatNumber" },
              { title: "Passenger", render: (_,r) => <><strong>{r.passengerName}</strong><div>{r.phoneNumber}</div><small className="sb-muted">{r.bookingReference ?? `#${r.bookingId}`}</small></> },
              { title: "Status", render: (_,r) => <Tag color={r.bookingStatus === "CONFIRMED" ? "green" : r.bookingStatus === "CANCELLED" ? "default" : "gold"}>{r.bookingStatus.replaceAll("_", " ")}</Tag> },
              { title: "Ticket value", render: (_,r) => formatMoney(r.amount) },
            ]} /></div>
          </div>
        </>}
      </section>}
      <details className="sb-card sb-owner__trips"><summary>Assigned fleet · {fleet.length} buses</summary><div className="sb-owner__fleet">{fleet.map(b => <div key={b.busId}><strong>Bus #{b.busId}</strong><p>{b.source} → {b.destination}</p><span className="sb-muted">{b.totalSeats} seats</span></div>)}</div></details>
      <p className="sb-muted">Confirmed ticket value is the value of confirmed bookings, not a bank settlement report. This dashboard shows current data when loaded; use Refresh to check for new bookings.</p>
    </main>
    <Modal title={editing ? "Edit departure" : "Add a departure"} open={open} onCancel={() => { if (!saving) { setOpen(false); setEditing(undefined); } }} onOk={() => void save()} okText={editing ? "Save changes" : "Add departure"} confirmLoading={saving} maskClosable={!saving} closable={!saving}>
      <div className="sb-stack">
        {formError && <Alert type="error" title={formError} />}
        <div className="sb-field"><label htmlFor="trip-bus">Assigned bus</label><Select id="trip-bus" value={newBus} onChange={setNewBus} options={fleet.map(b => ({ value: b.busId, label: `#${b.busId} · ${b.source} → ${b.destination}` }))} /></div>
        <div className="sb-field"><label htmlFor="trip-date">Travel date</label><input id="trip-date" className="sb-input" type="date" min={todayISO()} value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
        <div className="sb-field"><label htmlFor="trip-time">Departure time (Sri Lanka)</label><input id="trip-time" className="sb-input" type="time" value={newTime} onChange={e => setNewTime(e.target.value)} /></div>
        <div className="sb-field"><label htmlFor="trip-fare">Ticket fare (LKR)</label><InputNumber id="trip-fare" style={{ width: "100%" }} min={0.01} max={99999999.99} precision={2} value={fare} onChange={setFare} /></div>
        <p className="sb-muted">Departures must be at least one hour from now. A departure with booking history is locked so passenger tickets keep their original details. Check the bus’s operating plan; journey durations and turnaround times are not tracked here.</p>
      </div>
    </Modal>
  </div>;
};
export default OwnerDashboard;
