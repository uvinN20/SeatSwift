import NextTrip from "../../components/ui/NextTrip";
import PaymentWidget from "../../components/ui/PaymentWidget";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Modal, Segmented, Skeleton, Typography } from "antd";
import { Link } from "react-router-dom";
import SlipUploadModal from "../../components/payments/SlipUploadModal";
import SlipViewer from "../../components/payments/SlipViewer";
import { BookingStatusTag, PaymentStatusTag } from "../../components/payments/StatusTags";
import EmptyState from "../../components/common/EmptyState";
import { cancelMyBooking, fetchMySlip, getMyBookings } from "../../services/paymentService";
import type { PassengerBooking } from "../../types/payment";
import { errorMessage, formatMoney, formatTime } from "../../utils/format";
import { formatLongDate, isUpcoming } from "../../utils/dates";
import { ROUTES } from "../../types/routes";

type Tab = "upcoming" | "past" | "cancelled";

const PassengerBookings = () => {
  const [cancelFor, setCancelFor] = useState<PassengerBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [rows, setRows] = useState<PassengerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [uploadFor, setUploadFor] = useState<PassengerBooking | null>(null);

  const [slipOpen, setSlipOpen] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [slipType, setSlipType] = useState<string | null>(null);
  const [slipLoading, setSlipLoading] = useState(false);
  const [slipError, setSlipError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows((await getMyBookings()).data.data);
      setLoadError(null);
    } catch (err) {
      setLoadError(await errorMessage(err, "Could not load your bookings"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const g: Record<Tab, PassengerBooking[]> = { upcoming: [], past: [], cancelled: [] };
    for (const b of rows) {
      if (b.bookingStatus === "CANCELLED") g.cancelled.push(b);
      else if (isUpcoming(b.travelDate, b.departureTime)) g.upcoming.push(b);
      else g.past.push(b);
    }
    g.upcoming.sort((a, b) => `${a.travelDate} ${a.departureTime}`.localeCompare(`${b.travelDate} ${b.departureTime}`));
    return g;
  }, [rows]);

  const viewSlip = async (b: PassengerBooking) => {
    setSlipOpen(true);
    setSlipLoading(true);
    setSlipError(null);
    setSlipUrl(null);
    try {
      const res = await fetchMySlip(b.bookingId);
      setSlipType(res.data.type);
      setSlipUrl(URL.createObjectURL(res.data));
    } catch (err) {
      setSlipError(await errorMessage(err, "Could not load the slip"));
    } finally {
      setSlipLoading(false);
    }
  };

  const closeSlip = () => {
    if (slipUrl) URL.revokeObjectURL(slipUrl);
    setSlipUrl(null);
    setSlipOpen(false);
  };

  const cancelBooking = async () => {
    if (!cancelFor || cancelling) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelMyBooking(cancelFor.bookingId);
      setCancelFor(null);
      setCancelSuccess(true);
      await load();
    } catch (err) {
      setCancelError(await errorMessage(err, "Could not cancel this booking"));
    } finally {
      setCancelling(false);
    }
  };

  const list = groups[tab];

  return (
    <>
      <div className="sb-pagehead">
        <div className="sb-container sb-pagehead__row">
          <div>
            <h1>My bookings</h1>
            <p>Trips, payment status and tickets in one place.</p>
          </div>
          <Link to={ROUTES.SEARCH}><Button type="primary">Book a trip</Button></Link>
        </div>
      </div>

      <div className="sb-container sb-section sb-section--tight">
        {!loading && groups.upcoming[0] && <NextTrip booking={groups.upcoming[0]}/>}
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "upcoming", label: `Upcoming (${groups.upcoming.length})` },
            { value: "past", label: `Past (${groups.past.length})` },
            { value: "cancelled", label: `Cancelled (${groups.cancelled.length})` },
          ]}
          style={{ marginBottom: 16 }}
        />

        {cancelSuccess && <Alert type="success" showIcon closable onClose={() => setCancelSuccess(false)} title="Booking cancelled. Your seat has been released." description="If you already paid, contact the administrator about a refund. Refunds are not automatic." style={{ marginBottom: 12 }} />}
        {loadError && <Alert type="error" showIcon title={loadError} action={<Button size="small" onClick={() => { setLoading(true); void load(); }}>Retry</Button>} style={{ marginBottom: 12 }} />}

        {loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : list.length === 0 ? (
          <EmptyState
            title={tab === "upcoming" ? "No upcoming trips" : tab === "past" ? "No past trips" : "No cancelled bookings"}
            description={tab === "upcoming" ? "When you book a trip it will appear here." : undefined}
            action={tab === "upcoming" ? <Link to={ROUTES.SEARCH}><Button type="primary">Search buses</Button></Link> : undefined}
          />
        ) : (
          <div className="sb-list">
            {list.map((b, i) => (
              <article key={b.bookingId} className="sb-card sb-bcard" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                <div className="sb-bcard__top">
                  <div>
                    <div className="sb-bcard__route">{b.routeSource} → {b.routeDestination}</div>
                    <div className="sb-bcard__ref">Ref {b.bookingReference}</div>
                  </div>
                  <div className="sb-row" style={{ gap: 6 }}>
                    <BookingStatusTag status={b.bookingStatus} />
                    <PaymentStatusTag status={b.paymentStatus} />
                  </div>
                </div>

                {b.bookingStatus !== "CANCELLED" && <PaymentWidget status={b.paymentStatus} reason={b.rejectionReason}/>}
                <dl className="sb-bcard__facts" style={{ margin: 0 }}>
                  <div><dt>Date</dt><dd>{formatLongDate(b.travelDate)}</dd></div>
                  <div><dt>Departure</dt><dd>{formatTime(b.departureTime)}</dd></div>
                  <div><dt>Seat</dt><dd>{b.seatNumber}</dd></div>
                  <div><dt>Bus</dt><dd>#{b.busId}</dd></div>
                  <div><dt>Amount</dt><dd>{formatMoney(b.amount)}</dd></div>
                </dl>

                {b.bookingStatus !== "CANCELLED" && b.paymentStatus === "REJECTED" && b.rejectionReason && (
                  <Alert type="warning" showIcon title="Payment slip rejected" description={<Typography.Text>{b.rejectionReason}. Please upload a corrected slip.</Typography.Text>} />
                )}
                {b.bookingStatus === "PENDING_PAYMENT" && b.paymentStatus === "NOT_SUBMITTED" && (
                  <Alert type="info" showIcon title="Your seat is held. Upload your payment slip to confirm this booking." />
                )}

                {((b.bookingStatus !== "CANCELLED" && b.canUploadSlip) || b.paymentStatus !== "NOT_SUBMITTED" || (b.bookingStatus !== "CANCELLED" && isUpcoming(b.travelDate, b.departureTime))) && (
                  <div className="sb-bcard__actions">
                    {b.bookingStatus !== "CANCELLED" && b.canUploadSlip && (
                      <Button type="primary" onClick={() => setUploadFor(b)}>
                        {b.paymentStatus === "REJECTED" ? "Resubmit slip" : "Upload slip"}
                      </Button>
                    )}
                    {b.bookingStatus !== "CANCELLED" && isUpcoming(b.travelDate, b.departureTime) && (
                      <Button danger onClick={() => { setCancelError(null); setCancelFor(b); }}>Cancel booking</Button>
                    )}
                    {b.paymentStatus !== "NOT_SUBMITTED" && <Button onClick={() => void viewSlip(b)}>View slip</Button>}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal open={cancelFor !== null} title="Cancel this booking?" okText="Cancel booking"
        cancelText="Keep booking" okButtonProps={{ danger: true }} confirmLoading={cancelling}
        onOk={() => void cancelBooking()} onCancel={() => { if (!cancelling) setCancelFor(null); }} closable={!cancelling} maskClosable={!cancelling}>
        <p>Cancel booking {cancelFor?.bookingReference}? Your seat will become available to other passengers. This cannot be undone.</p>
        <p>If you already paid, contact the administrator about a refund. Refunds are not automatic.</p>
        {cancelError && <Alert type="error" showIcon title={cancelError} />}
      </Modal>
      <SlipUploadModal
        booking={uploadFor}
        onClose={() => setUploadFor(null)}
        onUploaded={() => { setUploadFor(null); void load(); }}
      />

      <Modal open={slipOpen} onCancel={closeSlip} footer={null} title="Payment slip" width={720} destroyOnHidden>
        <SlipViewer url={slipUrl} contentType={slipType} loading={slipLoading} error={slipError} />
      </Modal>
    </>
  );
};

export default PassengerBookings;
