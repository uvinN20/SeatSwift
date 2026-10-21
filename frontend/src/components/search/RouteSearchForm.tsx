import RouteLine from "../ui/RouteLine";
import { useMemo, useState } from "react";
import { Alert, Button, Select } from "antd";
import { SearchOutlined, SwapOutlined } from "@ant-design/icons";
import type { RouteItem } from "../../services/bookingService";
import { todayISO, addDaysISO } from "../../utils/dates";

export interface SearchValues {
  from: string;
  to: string;
  date: string;
}

interface Props {
  routes: RouteItem[];
  routesLoading?: boolean;
  routesError?: string | null;
  initial?: Partial<SearchValues>;
  loading?: boolean;
  onSearch: (v: SearchValues) => void;
  idPrefix?: string;
}

const RouteSearchForm = ({ routes, routesLoading, routesError, initial, loading, onSearch, idPrefix = "s" }: Props) => {
  const [from, setFrom] = useState<string | undefined>(initial?.from);
  const [to, setTo] = useState<string | undefined>(initial?.to);
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [swapped, setSwapped] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"from" | "to" | "date" | "route", string>>>({});

  const cities = useMemo(
    () => [...new Set(routes.flatMap((r) => [r.source, r.destination]))].sort(),
    [routes],
  );
  const options = cities.map((c) => ({ value: c, label: c }));

  const swap = () => {
    setFrom(to);
    setTo(from);
    setSwapped((s) => !s);
    setErrors({});
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!from) next.from = "Choose where you are leaving from";
    if (!to) next.to = "Choose your destination";
    if (from && to && from === to) next.to = "Destination must be different from the origin";
    if (!date) next.date = "Pick a travel date";
    else if (date < todayISO()) next.date = "Travel date cannot be in the past";
    if (from && to && from !== to && !routes.some((r) => r.source === from && r.destination === to)) {
      next.route = `No direct route from ${from} to ${to} is available`;
    }
    setErrors(next);
    if (Object.keys(next).length === 0 && from && to) onSearch({ from, to, date });
  };

  return (
    <form className="sb-search" onSubmit={submit} noValidate aria-label="Search buses">
      {routesError && <Alert type="error" showIcon title={routesError} style={{ marginBottom: 12 }} />}
      <div className="sb-search__grid">
        <div className="sb-field">
          <label htmlFor={`${idPrefix}-from`}>From</label>
          <Select
            id={`${idPrefix}-from`}
            showSearch
            placeholder="Boarding city"
            value={from}
            options={options}
            loading={routesLoading}
            status={errors.from ? "error" : undefined}
            onChange={(v) => { setFrom(v); setErrors({}); }}
            notFoundContent="No matching city"
          />
          {errors.from && <span className="sb-field__error" role="alert">{errors.from}</span>}
        </div>

        <button
          type="button"
          className={`sb-swap ${swapped ? "is-swapped" : ""}`}
          onClick={swap}
          aria-label="Swap origin and destination"
        >
          <SwapOutlined />
        </button>

        <div className="sb-field">
          <label htmlFor={`${idPrefix}-to`}>To</label>
          <Select
            id={`${idPrefix}-to`}
            showSearch
            placeholder="Destination city"
            value={to}
            options={options}
            loading={routesLoading}
            status={errors.to ? "error" : undefined}
            onChange={(v) => { setTo(v); setErrors({}); }}
            notFoundContent="No matching city"
          />
          {errors.to && <span className="sb-field__error" role="alert">{errors.to}</span>}
        </div>

        <div className="sb-field">
          <label htmlFor={`${idPrefix}-date`}>Journey date</label>
          <input
            id={`${idPrefix}-date`}
            type="date"
            min={todayISO()}
            value={date}
            onChange={(e) => { setDate(e.target.value); setErrors({}); }}
            aria-invalid={!!errors.date}
          />
          {errors.date && <span className="sb-field__error" role="alert">{errors.date}</span>}
        </div>

        <Button type="primary" size="large" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
          Search Buses
        </Button>
      </div>
      <div className="quick-travel-days" aria-label="Quick travel dates">{["Today", "Tomorrow", "Day after tomorrow"].map((label, offset) => {
        const value = addDaysISO(todayISO(), offset);
        return <button key={label} type="button" aria-pressed={date === value} onClick={() => { setDate(value); setErrors({}); }}>{label}</button>;
      })}<span>Booking closes 1 hour before departure · Sri Lanka time</span></div>
      {from && to && routes.some(r => r.source === from && r.destination === to) && <div className="search-route-preview"><span>{from}</span><RouteLine key={`${from}-${to}`} active reverse={swapped}/><span>{to}</span></div>}
      {errors.route && <div className="sb-field__error" role="alert" style={{ marginTop: 10 }}>{errors.route}</div>}
    </form>
  );
};

export default RouteSearchForm;
