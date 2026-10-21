import type { SeatItem } from "../../services/bookingService";

export interface SeatLayout {
  rows: (SeatItem | null)[][];
  cols: number;
  aisleAfter: number | null;
  inferred: boolean; // true when labels were parsed into a real row/column grid
}

const LABEL = /^([A-Za-z]+)\s*-?\s*(\d+)$/;

/**
 * The backend stores seat labels only (no coordinates), so the grid is derived from them:
 * letter = row, number = column (e.g. B3 -> row B, 3rd seat). Unparseable labels fall back to rows of four.
 */
export const buildSeatLayout = (seats: SeatItem[]): SeatLayout => {
  const parsed = seats.map((s) => ({ s, m: LABEL.exec(s.seatNumber.trim()) }));

  if (seats.length > 0 && parsed.every((p) => p.m)) {
    const byRow = new Map<string, Map<number, SeatItem>>();
    let cols = 0;
    for (const { s, m } of parsed) {
      const row = (m as RegExpExecArray)[1].toUpperCase();
      const col = Number((m as RegExpExecArray)[2]);
      cols = Math.max(cols, col);
      if (!byRow.has(row)) byRow.set(row, new Map());
      byRow.get(row)!.set(col, s);
    }
    if (cols >= 1 && cols <= 6) {
      const rowKeys = [...byRow.keys()].sort((a, b) => a.length - b.length || a.localeCompare(b));
      const rows = rowKeys.map((k) => Array.from({ length: cols }, (_, i) => byRow.get(k)!.get(i + 1) ?? null));
      return { rows, cols, aisleAfter: cols < 3 ? null : cols === 3 ? 2 : Math.floor(cols / 2), inferred: true };
    }
  }

  const sorted = [...seats].sort((a, b) => a.seatId - b.seatId);
  const rows: (SeatItem | null)[][] = [];
  for (let i = 0; i < sorted.length; i += 4) {
    const chunk: (SeatItem | null)[] = sorted.slice(i, i + 4);
    while (chunk.length < 4) chunk.push(null);
    rows.push(chunk);
  }
  return { rows, cols: 4, aisleAfter: 2, inferred: false };
};
