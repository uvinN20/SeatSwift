import { useEffect, useMemo, useState } from "react";
import { Alert, Input, Pagination, Select, Skeleton, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { BookingStatusTag } from "../../components/payments/StatusTags";
import EmptyState from "../../components/common/EmptyState";
import { getAdminBookings, type AdminBooking } from "../../services/paymentService";
import { errorMessage, formatMoney } from "../../utils/format";
import { useIsMobile } from "../../hooks/useMediaQuery";

const AdminReservations = () => {
  const [rows, setRows] = useState<AdminBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const isMobile = useIsMobile();
  const size = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setRows((await getAdminBookings()).data.data);
      } catch (err) {
        setError(await errorMessage(err, "Could not load reservations"));
      }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (b) =>
        (!status || b.bookingStatus === status) &&
        (!needle || [b.bookingReference, b.passengerName, b.phoneNumber].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [rows, q, status]);

  const columns: ColumnsType<AdminBooking> = [
    { title: "Reference", dataIndex: "bookingReference", sorter: (a, b) => a.bookingReference.localeCompare(b.bookingReference) },
    { title: "Passenger", dataIndex: "passengerName", sorter: (a, b) => a.passengerName.localeCompare(b.passengerName) },
    { title: "Phone", dataIndex: "phoneNumber" },
    { title: "Schedule", dataIndex: "scheduleId", sorter: (a, b) => a.scheduleId - b.scheduleId },
    { title: "Seat ID", dataIndex: "seatId" },
    { title: "Amount", render: (_, b) => formatMoney(b.amount) },
    { title: "Status", render: (_, b) => <BookingStatusTag status={b.bookingStatus} /> },
  ];

  return (
    <>
      <div className="sb-toolbar">
        <Input allowClear placeholder="Search reference, passenger or phone" style={{ maxWidth: 340 }} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select
          value={status}
          style={{ width: 200 }}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={[
            { value: "", label: "All statuses" },
            { value: "PENDING_PAYMENT", label: "Awaiting Payment" },
            { value: "CONFIRMED", label: "Booking Confirmed" },
            { value: "CANCELLED", label: "Booking Cancelled" },
          ]}
        />
      </div>

      {error && <Alert type="error" showIcon title={error} />}
      {!rows && !error && <Skeleton active paragraph={{ rows: 6 }} />}
      {rows && filtered.length === 0 && <EmptyState title="No reservations match" />}
      {rows && filtered.length > 0 && (isMobile ? (
        <>
          <div className="sb-list">
            {filtered.slice((page - 1) * size, page * size).map((b) => (
              <div key={b.bookingId} className="sb-card sb-pcard">
                <div className="sb-pcard__top"><span>{b.bookingReference}</span><BookingStatusTag status={b.bookingStatus} /></div>
                <div className="sb-pcard__line">{b.passengerName} · {b.phoneNumber}</div>
                <div className="sb-pcard__line">Schedule {b.scheduleId} · Seat ID {b.seatId} · {formatMoney(b.amount)}</div>
              </div>
            ))}
          </div>
          <Pagination style={{ marginTop: 16 }} align="center" simple current={page} pageSize={size} total={filtered.length} onChange={setPage} />
        </>
      ) : (
        <Table<AdminBooking>
          rowKey="bookingId"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: "max-content" }}
          pagination={{ current: page, pageSize: size, onChange: setPage, showSizeChanger: false }}
        />
      ))}
    </>
  );
};

export default AdminReservations;
