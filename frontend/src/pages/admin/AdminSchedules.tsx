import { useCallback, useEffect, useState } from "react";
import { Alert, Button, InputNumber, Modal, Pagination, Select, Skeleton, Table, notification } from "antd";
import type { ColumnsType } from "antd/es/table";
import EmptyState from "../../components/common/EmptyState";
import { createSchedule, getRoutes, getAdminSchedules, type RouteItem, type ScheduleItem } from "../../services/bookingService";
import { errorMessage, formatMoney, formatTime } from "../../utils/format";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { todayISO } from "../../utils/dates";

const AdminSchedules = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[] | null>(null);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const isMobile = useIsMobile();
  const size = 10;

  const [open, setOpen] = useState(false);
  const [routeId, setRouteId] = useState<number>();
  const [busId, setBusId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([getAdminSchedules(), getRoutes()]);
      setSchedules(s.data.data);
      setRoutes(r.data.data);
      setError(null);
    } catch (err) {
      setError(await errorMessage(err, "Could not load schedules"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const routeName = (id: number) => {
    const r = routes.find((x) => x.routeId === id);
    return r ? `${r.source} → ${r.destination}` : `Route ${id}`;
  };

  const save = async () => {
    if (!routeId || !busId || !date || !time || !price || price <= 0) {
      setFormError("Route, bus, date, time and a fare above zero are all required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createSchedule({ routeId, busId, travelDate: date, departureTime: time.length === 5 ? `${time}:00` : time, price });
      notification.success({ title: "Schedule created" });
      setOpen(false);
      setRouteId(undefined); setBusId(null); setDate(""); setTime(""); setPrice(null);
      await load();
    } catch (err) {
      setFormError(await errorMessage(err, "Could not create the schedule"));
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ScheduleItem> = [
    { title: "ID", dataIndex: "scheduleId", width: 70 },
    { title: "Route", render: (_, s) => routeName(s.routeId) },
    { title: "Bus", dataIndex: "busId" },
    { title: "Date", dataIndex: "travelDate", sorter: (a, b) => a.travelDate.localeCompare(b.travelDate) },
    { title: "Departure", render: (_, s) => formatTime(s.departureTime) },
    { title: "Fare", render: (_, s) => ((s.price ?? 0) > 0 ? formatMoney(s.price) : <span className="sb-tag sb-tag--warn">Fare not set</span>) },
  ];

  return (
    <>
      <div className="sb-toolbar" style={{ justifyContent: "space-between" }}>
        <p className="sb-muted">Trips without a fare cannot be booked by passengers.</p>
        <Button type="primary" onClick={() => setOpen(true)}>New schedule</Button>
      </div>

      {error && <Alert type="error" showIcon title={error} />}
      {!schedules && !error && <Skeleton active paragraph={{ rows: 6 }} />}
      {schedules && schedules.length === 0 && <EmptyState title="No schedules yet" description="Create the first journey schedule." />}
      {schedules && schedules.length > 0 && (isMobile ? (
        <>
          <div className="sb-list">
            {schedules.slice((page - 1) * size, page * size).map((s) => (
              <div key={s.scheduleId} className="sb-card sb-pcard">
                <div className="sb-pcard__top"><span>{routeName(s.routeId)}</span><span>{(s.price ?? 0) > 0 ? formatMoney(s.price) : "Fare not set"}</span></div>
                <div className="sb-pcard__line">{s.travelDate} · {formatTime(s.departureTime)} · Bus {s.busId} · #{s.scheduleId}</div>
              </div>
            ))}
          </div>
          <Pagination style={{ marginTop: 16 }} align="center" simple current={page} pageSize={size} total={schedules.length} onChange={setPage} />
        </>
      ) : (
        <Table<ScheduleItem>
          rowKey="scheduleId"
          columns={columns}
          dataSource={schedules}
          scroll={{ x: "max-content" }}
          pagination={{ current: page, pageSize: size, onChange: setPage, showSizeChanger: false }}
        />
      ))}

      <Modal open={open} title="New journey schedule" okText="Create schedule" onOk={() => void save()} onCancel={() => setOpen(false)} confirmLoading={saving} destroyOnHidden>
        <div className="sb-stack">
          <div className="sb-field">
            <label htmlFor="sch-route">Route</label>
            <Select id="sch-route" value={routeId} onChange={setRouteId} placeholder="Choose a route" options={routes.map((r) => ({ value: r.routeId, label: `${r.source} → ${r.destination}` }))} />
          </div>
          <div className="sb-field">
            <label htmlFor="sch-bus">Bus ID</label>
            <InputNumber id="sch-bus" min={1} style={{ width: "100%" }} value={busId} onChange={setBusId} />
          </div>
          <div className="sb-form-grid sb-form-grid--2">
            <div className="sb-field"><label htmlFor="sch-date">Travel date</label><input id="sch-date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="sb-field"><label htmlFor="sch-time">Departure time</label><input id="sch-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div className="sb-field">
            <label htmlFor="sch-price">Fare per seat (LKR)</label>
            <InputNumber id="sch-price" min={1} step={50} style={{ width: "100%" }} value={price} onChange={setPrice} />
          </div>
          {formError && <Alert type="error" showIcon title={formError} />}
        </div>
      </Modal>
    </>
  );
};

export default AdminSchedules;
