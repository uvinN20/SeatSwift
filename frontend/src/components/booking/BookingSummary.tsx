import CountUp from "../ui/CountUp";
import BottomSheet from "../ui/BottomSheet";
import { useState } from "react";
import { Button } from "antd";
import type { SeatItem, TripResult } from "../../services/bookingService";
import { formatMoney, formatTime } from "../../utils/format";
import { formatLongDate } from "../../utils/dates";

interface Props {
  trip: TripResult;
  selected: SeatItem[];
  continueLabel: string;
  onContinue: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/** Display-only estimate. The server recalculates the real amount from its own fare when seats are reserved. */
export const BookingSummary = ({ trip, selected, continueLabel, onContinue, disabled, loading }: Props) => {
  const total = trip.price * selected.length;
  return (
    <aside className="sb-card sb-summary sb-summary--desktop" aria-label="Booking summary">
      <h3>Booking summary</h3>
      <dl>
        <div><dt>Route</dt><dd>{trip.source} → {trip.destination}</dd></div>
        <div><dt>Date</dt><dd>{formatLongDate(trip.travelDate)}</dd></div>
        <div><dt>Departure</dt><dd>{formatTime(trip.departureTime)}</dd></div>
        <div><dt>Bus</dt><dd>#{trip.busId}</dd></div>
        <div>
          <dt>Seats</dt>
          <dd>
            {selected.length === 0 ? "None selected" : (
              <span className="sb-summary__seats">
                {selected.map((s) => <span key={s.seatId} className="sb-tag">{s.seatNumber}</span>)}
              </span>
            )}
          </dd>
        </div>
        <div><dt>Fare per seat</dt><dd>{formatMoney(trip.price)}</dd></div>
        <div><dt>Number of seats</dt><dd>{selected.length}</dd></div>
      </dl>
      <div className="sb-summary__total" aria-live="polite">
        <span>Total</span><span><CountUp value={total} money/></span>
      </div>
      <Button type="primary" size="large" block style={{ marginTop: 16 }} disabled={disabled || selected.length === 0} loading={loading} onClick={onContinue}>
        {continueLabel}
      </Button>
      <p className="sb-summary__note">Seats are only reserved when you continue and the server accepts them.</p>
    </aside>
  );
};

export const SummaryBar = ({ trip, selected, continueLabel, onContinue, disabled, loading }: Props) => {
 const [open, setOpen] = useState(false);
 return (<>
  <div className="sb-summary-bar" role="region" aria-label="Booking summary">
    <div>
      <button className="summary-expand" onClick={() => setOpen(true)} aria-expanded={open} aria-label="Expand booking summary"><CountUp value={trip.price * selected.length} money/> ⌃</button>
      <div className="sb-summary-bar__sub">
        {selected.length === 0 ? "Select your seats" : `${selected.length} ${selected.length === 1 ? "seat" : "seats"}: ${selected.map((s) => s.seatNumber).join(", ")}`}
      </div>
    </div>
    <Button type="primary" size="large" disabled={disabled || selected.length === 0} loading={loading} onClick={onContinue}>
      {continueLabel}
    </Button>
  </div><BottomSheet open={open} onClose={() => setOpen(false)} title="Your journey"><div className="sheet-summary"><BookingSummary trip={trip} selected={selected} continueLabel={continueLabel} onContinue={() => { setOpen(false); onContinue(); }} disabled={disabled} loading={loading}/></div></BottomSheet></>
); };
