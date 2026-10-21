import { useEffect, useState } from "react";
import type { PassengerBooking } from "../../types/payment";
import { formatTime } from "../../utils/format";
import { formatLongDate } from "../../utils/dates";
import RouteLine from "./RouteLine";
import Widget from "./Widget";
export default function NextTrip({ booking }: { booking: PassengerBooking }) {
 const [now, setNow] = useState(Date.now());
 useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
 const departure = new Date(`${booking.travelDate}T${booking.departureTime}+05:30`).getTime();
 const hours = Math.max(0, Math.floor((departure - now) / 3600000));
 return <Widget label="Your next scheduled departure" className="next-trip"><div><h2>{booking.routeSource} → {booking.routeDestination}</h2><RouteLine/><p>{formatLongDate(booking.travelDate)} · Seat {booking.seatNumber}</p><span className="sb-tag">{booking.bookingStatus === "CONFIRMED" ? "Confirmed booking" : "Payment verification required"}</span></div><div className="next-trip-time"><strong>{formatTime(booking.departureTime)}</strong><span>{hours >= 24 ? `In ${Math.floor(hours / 24)} days` : hours > 0 ? `In ${hours} hours` : "Within the hour"}</span><small>Sri Lanka time · scheduled, not live tracking</small></div></Widget>;
}
