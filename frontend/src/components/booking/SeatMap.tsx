import { m, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import type { SeatItem } from "../../services/bookingService";
import { buildSeatLayout } from "./seatLayout";

interface Props {
  seats: SeatItem[];
  selectedIds: number[];
  maxSeats: number;
  onToggle: (seat: SeatItem) => void;
  onLimit: () => void;
  readOnly?: boolean;
}

const SteeringIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="M12 14.5V21M9.6 11H3.2M14.4 11h6.4" />
  </svg>
);

const SeatLegend = ({ readOnly }: { readOnly: boolean }) => (
  <ul className="sb-legend" aria-label="Seat legend">
    <li><span className="sb-seat" aria-hidden="true" />Available</li>
    {!readOnly && <li><span className="sb-seat sb-seat--selected" aria-hidden="true">✓</span>Selected</li>}
    <li><span className="sb-seat sb-seat--occupied" aria-hidden="true">✕</span>Occupied</li>
  </ul>
);

const SeatMap = ({ seats, selectedIds, maxSeats, onToggle, onLimit, readOnly = false }: Props) => {
  const reduced = useReducedMotion();
  const layout = useMemo(() => buildSeatLayout(seats), [seats]);

  // columns: seat, seat, [aisle], seat, seat ...
  const template = useMemo(() => {
    const parts: string[] = [];
    for (let c = 1; c <= layout.cols; c++) {
      parts.push(`minmax(${readOnly ? 32 : 44}px, 1fr)`);
      if (layout.aisleAfter === c && c < layout.cols) parts.push("18px");
    }
    return parts.join(" ");
  }, [layout, readOnly]);

  return (
    <div className="sb-seatpanel sb-card">{!readOnly && <p className="sr-only" role="status">{selectedIds.length} of {maxSeats} seats selected</p>}
      <SeatLegend readOnly={readOnly} />

      <div className="sb-bus-shell" role="group" aria-label="Bus seat map">
        <div className="sb-bus-shell__front">
          <span>Front</span>
          <span className="sb-driver"><SteeringIcon /> Driver</span>
        </div>

        <div className="sb-seatgrid" style={{ gridTemplateColumns: template, columnGap: 8 }}>
          {layout.rows.flatMap((row, r) =>
            row.flatMap((seat, c) => {
              const cells = [];
              if (!seat) {
                cells.push(<div key={`e-${r}-${c}`} aria-hidden="true" />);
              } else {
                const occupied = seat.booked;
                const selected = selectedIds.includes(seat.seatId);
                const state = occupied ? "occupied" : selected ? "selected" : "available";
                const limitReached = !selected && !occupied && selectedIds.length >= maxSeats;
                cells.push(
                  <m.button
                    whileTap={reduced ? undefined : { scale: .94 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: .9 }}
                    onKeyDown={(event) => {
                      const offsets: Record<string, [number, number]> = { ArrowLeft: [0,-1], ArrowRight: [0,1], ArrowUp: [-1,0], ArrowDown: [1,0] };
                      if (!offsets[event.key]) return;
                      event.preventDefault();
                      const [dr, dc] = offsets[event.key]; let nr = r + dr, nc = c + dc;
                      while (nr >= 0 && nr < layout.rows.length && nc >= 0 && nc < layout.cols) {
                        const target = layout.rows[nr][nc];
                        if (target && !target.booked) { document.getElementById(`seat-${target.seatId}`)?.focus(); break; }
                        nr += dr; nc += dc;
                      }
                    }}
                    id={`seat-${seat.seatId}`}
                    key={seat.seatId}
                    type="button"
                    className={`sb-seat ${selected ? "sb-seat--selected" : ""} ${occupied ? "sb-seat--occupied" : ""}`}
                    disabled={occupied || readOnly}
                    aria-pressed={occupied ? undefined : selected}
                    aria-label={`Seat ${seat.seatNumber}, ${state}`}
                    onClick={() => (limitReached ? onLimit() : onToggle(seat))}
                  >
                    <span>{seat.seatNumber}</span>
                    {selected && <span className="sb-seat__mark" aria-hidden="true">✓</span>}
                    {occupied && <span className="sb-seat__mark" aria-hidden="true">✕</span>}
                  </m.button>,
                );
              }
              if (layout.aisleAfter === c + 1 && c + 1 < layout.cols) {
                cells.push(<div key={`a-${r}-${c}`} className="sb-aisle" aria-hidden="true" />);
              }
              return cells;
            }),
          )}
        </div>

        <div className="sb-bus-shell__rear">Rear</div>
      </div>

      {!layout.inferred && (
        <p className="sb-muted" style={{ fontSize: "0.82rem", textAlign: "center" }}>
          Seats are shown in rows of four in booking order.
        </p>
      )}
    </div>
  );
};

export default SeatMap;
