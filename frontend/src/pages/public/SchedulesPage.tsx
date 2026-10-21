import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Select, Skeleton } from "antd";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import { getRoutes, getSchedules, type RouteItem, type ScheduleItem } from "../../services/bookingService";
import { errorMessage, formatMoney, formatTime } from "../../utils/format";
import { formatLongDate, todayISO, addDaysISO, isBookable } from "../../utils/dates";
import { ROUTES } from "../../types/routes";

const SchedulesPage = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [routeId, setRouteId] = useState<number | "">("");
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    const load = async () => {
      try {
        const [r, s] = await Promise.all([getRoutes(), getSchedules()]);
        setRoutes(r.data.data);
        setSchedules(s.data.data);
      } catch (err) {
        setError(await errorMessage(err, "Could not load schedules"));
      }
    };
    void load();
  }, []);

  const name = (id: number) => {
    const r = routes.find((x) => x.routeId === id);
    return r ? `${r.source} → ${r.destination}` : `Route ${id}`;
  };

  const grouped = useMemo(() => {
    const today = todayISO();
    const list = (schedules ?? [])
      .filter((s) => s.travelDate >= today && isBookable(s.travelDate, s.departureTime) && (s.price ?? 0) > 0 && (routeId === "" || s.routeId === routeId) && (!date || s.travelDate === date))
      .sort((a, b) => `${a.travelDate} ${a.departureTime}`.localeCompare(`${b.travelDate} ${b.departureTime}`));
    const map = new Map<string, ScheduleItem[]>();
    for (const s of list) map.set(s.travelDate, [...(map.get(s.travelDate) ?? []), s]);
    return [...map.entries()];
  }, [schedules, routeId, date]);

  return (
    <>
      <div className="sb-pagehead">
        <div className="sb-container">
          <h1>Bus schedules</h1>
          <p>Today and upcoming trips. Booking closes 1 hour before departure, in Sri Lanka time.</p>
        </div>
      </div>
      <div className="sb-container sb-section sb-section--tight">
        <div className="sb-toolbar">
          <div className="sb-field" style={{ minWidth: 240 }}>
            <label htmlFor="sch-filter-route">Route</label>
            <Select
              id="sch-filter-route"
              value={routeId}
              onChange={setRouteId}
              options={[{ value: "", label: "All routes" }, ...routes.map((r) => ({ value: r.routeId, label: `${r.source} → ${r.destination}` }))]}
            />
          </div>
          <div className="sb-field">
            <label htmlFor="sch-filter-date">Date</label>
            <input id="sch-filter-date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {(routeId !== "" || date) && <Button onClick={() => { setRouteId(""); setDate(""); }}>Clear filters</Button>}
        </div>

        <div className="quick-travel-days" aria-label="Quick travel dates">{["Today", "Tomorrow", "Day after tomorrow"].map((label, offset) => {
          const value = addDaysISO(todayISO(), offset);
          return <button key={label} type="button" aria-pressed={date === value} onClick={() => setDate(value)}>{label}</button>;
        })}</div>
        {error && <Alert type="error" showIcon title={error} />}
        {!schedules && !error && <Skeleton active paragraph={{ rows: 6 }} />}
        {schedules && grouped.length === 0 && (
          <EmptyState title="No upcoming trips found" description="Try a different route or date." />
        )}
        <div className="sb-stack">
          {grouped.map(([d, items]) => (
            <section key={d} aria-label={formatLongDate(d)}>
              <h2 style={{ fontSize: "1.05rem", marginBottom: 10 }}>{formatLongDate(d)}</h2>
              <div className="sb-list">
                {items.map((s) => (
                  <div key={s.scheduleId} className="sb-card sb-pcard">
                    <div className="sb-pcard__top">
                      <span>{formatTime(s.departureTime)} · {name(s.routeId)}</span>
                      <span>{formatMoney(s.price)}</span>
                    </div>
                    <div className="sb-pcard__line">Bus #{s.busId}</div>
                    <div>
                      <Button type="primary" size="small" onClick={() => navigate(`${ROUTES.BOOK}/${s.scheduleId}`)}>View seats</Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
};

export default SchedulesPage;
