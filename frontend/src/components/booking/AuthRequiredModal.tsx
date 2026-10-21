import BottomSheet from "../ui/BottomSheet";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { Button, Modal, Space } from "antd";
import { LockOutlined } from "@ant-design/icons";
import type { SeatItem, TripResult } from "../../services/bookingService";
import { formatMoney, formatTime } from "../../utils/format";
import { formatLongDate } from "../../utils/dates";

interface Props {
  open: boolean;
  trip: TripResult;
  seats: SeatItem[];
  onLogin: () => void;
  onRegister: () => void;
  onClose: () => void;
}

/** Shown when an anonymous visitor tries to book. Nothing has been reserved at this point. */
const AuthRequiredModal = ({ open, trip, seats, onLogin, onRegister, onClose }: Props) => {
 const mobile = useMediaQuery("(max-width: 640px)");
 const content = (
    <div className="sb-stack" style={{ paddingTop: 8 }}>
      <div className="sb-done__icon" style={{ margin: "0 auto", animation: "none" }} aria-hidden="true">
        <LockOutlined />
      </div>
      <h2 style={{ textAlign: "center", fontSize: "1.35rem" }}>Sign in to book your seat</h2>
      <p style={{ textAlign: "center" }} className="sb-muted">
        Please log in or create an account to book your seat. Your selection will be kept while you sign in.
      </p>

      <dl className="sb-bank" aria-label="Your selection">
        <div><dt>Route</dt><dd>{trip.source} → {trip.destination}</dd></div>
        <div><dt>Date</dt><dd>{formatLongDate(trip.travelDate)} · {formatTime(trip.departureTime)}</dd></div>
        <div><dt>Seats</dt><dd>{seats.map((s) => s.seatNumber).join(", ")}</dd></div>
        <div><dt>Estimated total</dt><dd>{formatMoney(trip.price * seats.length)}</dd></div>
      </dl>

      <Space orientation="vertical" style={{ width: "100%" }}>
        <Button type="primary" size="large" block onClick={onLogin}>Log in</Button>
        <Button size="large" block onClick={onRegister}>Create account</Button>
        <Button type="text" block onClick={onClose}>Continue browsing</Button>
      </Space>
    </div>
 );
 return mobile ? <BottomSheet open={open} onClose={onClose} title="Continue your journey">{content}</BottomSheet> : <Modal open={open} onCancel={onClose} footer={null} title={null} width={460} centered destroyOnHidden>{content}</Modal>;
};

export default AuthRequiredModal;
