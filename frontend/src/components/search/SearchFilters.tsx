import { Slider, Switch } from "antd";
import { formatMoney } from "../../utils/format";
import { BANDS, type Filters, type TimeBand } from "./filterConfig";

interface Props {
  value: Filters;
  fareBounds: [number, number];
  onChange: (f: Filters) => void;
  onReset: () => void;
}

const SearchFilters = ({ value, fareBounds, onChange, onReset }: Props) => {
  const toggle = (b: TimeBand) =>
    onChange({
      ...value,
      bands: value.bands.includes(b) ? value.bands.filter((x) => x !== b) : [...value.bands, b],
    });

  const single = fareBounds[0] === fareBounds[1];

  return (
    <div className="sb-filters">
      <div>
        <h4 id="f-dep">Departure time</h4>
        <div className="sb-chips" role="group" aria-labelledby="f-dep">
          {BANDS.map((b) => (
            <button
              key={b.key}
              type="button"
              className="sb-chip"
              aria-pressed={value.bands.includes(b.key)}
              title={b.hint}
              onClick={() => toggle(b.key)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 id="f-fare">Fare per seat</h4>
        {single ? (
          <p className="sb-muted">All trips are {formatMoney(fareBounds[0])}</p>
        ) : (
          <>
            <Slider
              range
              min={fareBounds[0]}
              max={fareBounds[1]}
              value={value.fare}
              tooltip={{ formatter: (v) => formatMoney(v ?? 0) }}
              onChange={(v) => onChange({ ...value, fare: [v[0], v[1]] })}
              aria-labelledby="f-fare"
            />
            <div className="sb-row" style={{ justifyContent: "space-between" }}>
              <span>{formatMoney(value.fare[0])}</span>
              <span>{formatMoney(value.fare[1])}</span>
            </div>
          </>
        )}
      </div>

      <div className="sb-row" style={{ justifyContent: "space-between" }}>
        <label htmlFor="f-soldout" style={{ fontWeight: 600 }}>Hide sold-out trips</label>
        <Switch id="f-soldout" checked={value.hideSoldOut} onChange={(v) => onChange({ ...value, hideSoldOut: v })} />
      </div>

      <button type="button" className="sb-chip" onClick={onReset}>Reset filters</button>
    </div>
  );
};

export default SearchFilters;
