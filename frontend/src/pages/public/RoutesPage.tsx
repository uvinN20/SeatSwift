import RouteLine from "../../components/ui/RouteLine";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Skeleton } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import { getRoutes, getSchedules, type RouteItem, type ScheduleItem } from "../../services/bookingService";
import { errorMessage, formatMoney } from "../../utils/format";
import { todayISO } from "../../utils/dates";
import { ROUTES } from "../../types/routes";

// Public page: every figure is derived from the public routes and schedules endpoints.
const RoutesPage = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteItem[] | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [r, s] = await Promise.all([getRoutes(), getSchedules()]);
        setRoutes(r.data.data);
        setSchedules(s.data.data);
      } catch (err) {
        setError(await errorMessage(err, "Could not load routes"));
      }
    };
    void load();
  }, []);

  const rows = useMemo(() => {
    const today = todayISO();
    return (routes ?? []).map((r) => {
      const trips = schedules
        .filter((s) => s.routeId === r.routeId && s.travelDate >= today && (s.price ?? 0) > 0)
        .sort((a, b) => `${a.travelDate} ${a.departureTime}`.localeCompare(`${b.travelDate} ${b.departureTime}`));
      return {
        route: r,
        trips: trips.length,
        next: trips[0]?.travelDate ?? null,
        from: trips.length ? Math.min(...trips.map((t) => t.price as number)) : null,
      };
    });
  }, [routes, schedules]);

  return (
    <>
      <div className="sb-pagehead">
        <div className="sb-container">
          <h1>Routes</h1>
          <p>Every route we serve, with upcoming trips and the lowest fare.</p>
        </div>
      </div>
      <div className="sb-container sb-section sb-section--tight">
        {error && <Alert type="error" showIcon title={error} />}
        {!routes && !error && <Skeleton active paragraph={{ rows: 5 }} />}
        {routes && routes.length === 0 && <EmptyState title="No routes published yet" />}
        {routes && routes.length > 0 && (
          <div className="sb-routes">
            {rows.map(({ route, trips, next, from }) => (
              <div key={route.routeId} className="sb-route-card" style={{ cursor: "default" }}>
                <span className="sb-route-card__path">
                  {route.source} <ArrowRightOutlined aria-hidden="true" /> {route.destination}
                </span>
                <RouteLine active/>
                <span className="sb-route-card__meta">
                  <span>{trips === 0 ? "No upcoming trips" : `${trips} upcoming ${trips === 1 ? "trip" : "trips"}`}</span>
                  {from !== null && <span className="sb-route-card__fare">from {formatMoney(from)}</span>}
                </span>
                <div className="sb-row">
                  <Button
                    type="primary"
                    disabled={!next}
                    onClick={() => navigate(`${ROUTES.SEARCH}?from=${encodeURIComponent(route.source)}&to=${encodeURIComponent(route.destination)}&date=${next}`)}
                  >
                    Find buses
                  </Button>
                  <Link to={ROUTES.SCHEDULES}><Button>Schedules</Button></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default RoutesPage;
