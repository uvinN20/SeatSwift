import CapacityRing from "../ui/CapacityRing";
import CountUp from "../ui/CountUp";
import RouteLine from "../ui/RouteLine";
import { Button } from "antd";
import type { TripResult } from "../../services/bookingService";
import { formatTime } from "../../utils/format";

interface Props {
  trip: TripResult;
  index: number;
  onSelect: (t: TripResult) => void;
}

const BusResultCard = ({ trip, index, onSelect }: Props) => {
  const soldOut = trip.availableSeats === 0;
  const low = !soldOut && trip.availableSeats <= 5;

  return (
    <article
      className="sb-card sb-bus"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      aria-label={`Departure ${formatTime(trip.departureTime)}, ${trip.source} to ${trip.destination}`}
    >
      <div>
        <div className="sb-bus__times">
          <div>
            <div className="sb-bus__time">{formatTime(trip.departureTime)}</div>
            <div className="sb-bus__place">{trip.source}</div>
          </div>
          <RouteLine/>
          <div>
            <div className="sb-bus__time" style={{ fontSize: "1.15rem" }}>{trip.destination}</div>
            <div className="sb-bus__place">Destination</div>
          </div>
        </div>
        <div className="sb-bus__meta"><CapacityRing available={trip.availableSeats} total={trip.totalSeats}/>
          <span className="sb-tag">Bus #{trip.busId}</span>
          <span className="sb-tag">{trip.totalSeats} seats</span>
          {soldOut ? (
            <span className="sb-tag sb-tag--bad">Sold out</span>
          ) : low ? (
            <span className="sb-tag sb-tag--warn">Only {trip.availableSeats} left</span>
          ) : (
            <span className="sb-tag sb-tag--ok">{trip.availableSeats} seats available</span>
          )}
        </div>
      </div>

      <div className="sb-bus__buy">
        <div className="sb-bus__fare">
          <CountUp value={trip.price} money/>
          <small>per seat</small>
        </div>
        <Button type="primary" size="large" disabled={soldOut} onClick={() => onSelect(trip)}>
          {soldOut ? "Sold out" : "Select seats"}
        </Button>
      </div>
    </article>
  );
};

export default BusResultCard;
