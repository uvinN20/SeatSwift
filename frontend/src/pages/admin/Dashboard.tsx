import CountUp from "../../components/ui/CountUp";
import { useEffect, useState } from "react";
import { Alert, Button, Skeleton } from "antd";
import { Link } from "react-router-dom";
import { PaymentStatusTag } from "../../components/payments/StatusTags";
import EmptyState from "../../components/common/EmptyState";
import { getAdminBookings, searchPayments } from "../../services/paymentService";
import { getAdminSchedules } from "../../services/bookingService";
import type { PaymentDetail } from "../../types/payment";
import { errorMessage, formatDateTime, formatMoney } from "../../utils/format";
import { todayISO } from "../../utils/dates";
import { ROUTES } from "../../types/routes";

interface Stats {
  total: number;
  confirmed: number;
  awaitingPayment: number;
  cancelled: number;
  pendingVerification: number;
  verified: number;
  rejected: number;
  upcomingTrips: number;
  recent: PaymentDetail[];
}

// All figures come from live backend queries. Revenue is intentionally not shown here yet.
const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [pending, verified, rejected, recent, bookings, schedules] = await Promise.all([
          searchPayments({ status: "PENDING_VERIFICATION", page: 0, size: 1 }),
          searchPayments({ status: "VERIFIED", page: 0, size: 1 }),
          searchPayments({ status: "REJECTED", page: 0, size: 1 }),
          searchPayments({ page: 0, size: 6 }),
          getAdminBookings(),
          getAdminSchedules(),
        ]);
        const b = bookings.data.data;
        const today = todayISO();
        setStats({
          total: b.length,
          confirmed: b.filter((x) => x.bookingStatus === "CONFIRMED").length,
          awaitingPayment: b.filter((x) => x.bookingStatus === "PENDING_PAYMENT").length,
          cancelled: b.filter((x) => x.bookingStatus === "CANCELLED").length,
          pendingVerification: pending.data.data.totalItems,
          verified: verified.data.data.totalItems,
          rejected: rejected.data.data.totalItems,
          upcomingTrips: schedules.data.data.filter((s) => s.travelDate >= today).length,
          recent: recent.data.data.items,
        });
      } catch (err) {
        setError(await errorMessage(err, "Could not load dashboard data"));
      }
    };
    void load();
  }, []);

  if (error) return <Alert type="error" showIcon title={error} />;
  if (!stats) return <Skeleton active paragraph={{ rows: 8 }} />;

  const cards: { label: string; value: number; accent?: boolean }[] = [
    { label: "Payments awaiting verification", value: stats.pendingVerification, accent: true },
    { label: "Total bookings", value: stats.total },
    { label: "Confirmed bookings", value: stats.confirmed },
    { label: "Awaiting payment", value: stats.awaitingPayment },
    { label: "Upcoming scheduled trips", value: stats.upcomingTrips },
    { label: "Cancelled bookings", value: stats.cancelled },
  ];

  return (
    <>
      <div className="sb-stats">
        {cards.map((c) => (
          <div key={c.label} className={`sb-card sb-stat ${c.accent ? "sb-stat--accent" : ""}`}>
            <div className="sb-stat__label">{c.label}</div>
            <div className="sb-stat__value"><CountUp value={c.value}/></div>
          </div>
        ))}
      </div>

      <div className="sb-bento" style={{ gridTemplateColumns: undefined }}>
        <section className="sb-card sb-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="sb-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Recent payment submissions</h2>
            <Link to={ROUTES.ADMIN_PAYMENTS}><Button type="primary">Review payments</Button></Link>
          </div>
          <p className="sb-muted" style={{ marginBottom: 12 }}>
            Verified {stats.verified} · Rejected {stats.rejected} · Pending {stats.pendingVerification}
          </p>
          {stats.recent.length === 0 ? (
            <EmptyState title="No payments submitted yet" />
          ) : (
            <div className="sb-list">
              {stats.recent.map((p) => (
                <div key={p.paymentId} className="sb-card sb-pcard">
                  <div className="sb-pcard__top">
                    <span>{p.paymentReference} · {p.passengerName}</span>
                    <PaymentStatusTag status={p.paymentStatus} />
                  </div>
                  <div className="sb-pcard__line">
                    {p.routeSource} → {p.routeDestination} · {formatMoney(p.amount)} · {formatDateTime(p.uploadedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Dashboard;
