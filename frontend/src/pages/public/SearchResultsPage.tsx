import BottomSheet from "../../components/ui/BottomSheet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Select, Skeleton } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import BusResultCard from "../../components/search/BusResultCard";
import RouteSearchForm, { type SearchValues } from "../../components/search/RouteSearchForm";
import SearchFilters from "../../components/search/SearchFilters";
import { BANDS, type Filters } from "../../components/search/filterConfig";
import EmptyState from "../../components/common/EmptyState";
import { getRoutes, searchTrips, type RouteItem, type TripResult } from "../../services/bookingService";
import { addDaysISO, formatLongDate, todayISO } from "../../utils/dates";
import { errorMessage } from "../../utils/format";
import { ROUTES } from "../../types/routes";

type Sort = "earliest" | "fare" | "seats";

const bandOf = (time: string) => {
  const h = Number(time.slice(0, 2));
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
};

const SearchResultsPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const date = params.get("date") ?? "";
  const valid = !!(from && to && date);

  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [trips, setTrips] = useState<TripResult[]>([]);
  const [loading, setLoading] = useState(valid);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<Sort>("earliest");
  const [filters, setFilters] = useState<Filters>({ bands: [], fare: [0, 0], hideSoldOut: false });
  const [fareTouched, setFareTouched] = useState(false);

  const load = useCallback(async () => {
    if (!from || !to || !date) return;
    setLoading(true);
    setError(null);
    try {
      const res = await searchTrips(from, to, date);
      setTrips(res.data.data);
      setFareTouched(false);
    } catch (err) {
      setTrips([]);
      setError(await errorMessage(err, "Could not search trips. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [from, to, date]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setRoutes((await getRoutes()).data.data);
      } catch {
        /* the edit-search panel just stays empty; results are unaffected */
      }
    };
    void loadRoutes();
  }, []);

  const fareBounds = useMemo<[number, number]>(() => {
    if (trips.length === 0) return [0, 0];
    const fares = trips.map((t) => t.price);
    return [Math.min(...fares), Math.max(...fares)];
  }, [trips]);

  const effective = useMemo<Filters>(
    () => (fareTouched ? filters : { ...filters, fare: fareBounds }),
    [fareTouched, filters, fareBounds],
  );

  const visible = useMemo(() => {
    const out = trips.filter(
      (t) =>
        (effective.bands.length === 0 || effective.bands.includes(bandOf(t.departureTime))) &&
        t.price >= effective.fare[0] &&
        t.price <= effective.fare[1] &&
        (!effective.hideSoldOut || t.availableSeats > 0),
    );
    out.sort((a, b) =>
      sort === "fare"
        ? a.price - b.price
        : sort === "seats"
          ? b.availableSeats - a.availableSeats
          : a.departureTime.localeCompare(b.departureTime),
    );
    return out;
  }, [trips, effective, sort]);

  const setSearch = (v: SearchValues) => {
    setEditing(false);
    navigate(`${ROUTES.SEARCH}?from=${encodeURIComponent(v.from)}&to=${encodeURIComponent(v.to)}&date=${v.date}`);
  };

  const gotoDate = (d: string) =>
    navigate(`${ROUTES.SEARCH}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${d}`);

  const select = (t: TripResult) => navigate(`${ROUTES.BOOK}/${t.scheduleId}`, { state: { trip: t }, viewTransition: !matchMedia("(prefers-reduced-motion: reduce)").matches });

  const filterPanel = (
    <SearchFilters
      value={effective}
      fareBounds={fareBounds}
      onChange={(f) => { setFilters(f); setFareTouched(true); }}
      onReset={() => { setFilters({ bands: [], fare: fareBounds, hideSoldOut: false }); setFareTouched(false); }}
    />
  );

  if (!valid) {
    return (
      <div className="sb-container sb-section">
        <RouteSearchForm routes={routes} onSearch={setSearch} idPrefix="empty" />
        <div style={{ marginTop: 20 }}>
          <EmptyState title="Where would you like to go?" description="Choose your origin, destination and travel date to see available buses." />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sb-pagehead">
        <div className="sb-container sb-pagehead__row">
          <div>
            <h1>{from} → {to}</h1>
            <p>{formatLongDate(date)}</p>
          </div>
          <Button onClick={() => setEditing((e) => !e)} aria-expanded={editing}>
            {editing ? "Close" : "Edit search"}
          </Button>
        </div>
        {editing && (
          <div className="sb-container" style={{ marginTop: 16 }}>
            <RouteSearchForm routes={routes} initial={{ from, to, date }} onSearch={setSearch} idPrefix="edit" />
          </div>
        )}
      </div>

      <div className="sb-container sb-results-layout">
        <aside className="sb-card sb-filters-aside" aria-label="Filters">
          {filterPanel}
        </aside>

        <section aria-live="polite">
          <div className="sb-sortbar">
            <span className="sb-muted">
              {loading ? "Searching…" : `${visible.length} of ${trips.length} ${trips.length === 1 ? "trip" : "trips"}`}
            </span>
            <div className="sb-row">
              <Button className="sb-filters-toggle" icon={<FilterOutlined />} onClick={() => setFiltersOpen(true)}>
                Filters
              </Button>
              <Select
                aria-label="Sort trips"
                value={sort}
                onChange={setSort}
                style={{ minWidth: 170 }}
                options={[
                  { value: "earliest", label: "Earliest departure" },
                  { value: "fare", label: "Lowest fare" },
                  { value: "seats", label: "Most seats available" },
                ]}
              />
            </div>
          </div>

          {error ? (
            <Alert
              type="error"
              showIcon
              title={error}
              action={<Button size="small" onClick={() => void load()}>Retry</Button>}
            />
          ) : loading ? (
            <div className="sb-list">
              {[0, 1, 2].map((i) => (
                <div key={i} className="sb-card" style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 2 }} /></div>
              ))}
            </div>
          ) : trips.length === 0 ? (
            <EmptyState
              title="No buses found for this date"
              description="There are no bookable trips on this route for the selected day. Try a nearby date."
              action={
                <>
                  {date > todayISO() && <Button onClick={() => gotoDate(addDaysISO(date, -1))}>Previous day</Button>}
                  <Button type="primary" onClick={() => gotoDate(addDaysISO(date, 1))}>Next day</Button>
                </>
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No trips match your filters"
              description={`Showing none of the ${trips.length} trips. Try loosening the filters (${BANDS.length} time bands available).`}
              action={<Button onClick={() => { setFilters({ bands: [], fare: fareBounds, hideSoldOut: false }); setFareTouched(false); }}>Reset filters</Button>}
            />
          ) : (
            <div className="sb-list">
              {visible.map((t, i) => (
                <BusResultCard key={t.scheduleId} trip={t} index={i} onSelect={select} />
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Refine your journey">
        {filterPanel}
        <Button type="primary" block size="large" style={{ marginTop: 16 }} onClick={() => setFiltersOpen(false)}>
          Show {visible.length} {visible.length === 1 ? "trip" : "trips"}
        </Button>
      </BottomSheet>
    </>
  );
};

export default SearchResultsPage;
