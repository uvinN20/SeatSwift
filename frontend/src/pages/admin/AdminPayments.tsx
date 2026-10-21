import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Descriptions, Drawer, Input, Modal, Pagination, Select, Space, Table, Timeline, Typography, notification } from "antd";
import { useIsMobile } from "../../hooks/useMediaQuery";
import type { ColumnsType } from "antd/es/table";
import SlipViewer from "../../components/payments/SlipViewer";
import { BookingStatusTag, PaymentStatusTag } from "../../components/payments/StatusTags";
import {
  approvePayment,
  fetchAdminSlip,
  getPaymentHistory,
  rejectPayment,
  searchPayments,
} from "../../services/paymentService";
import type { PaymentAudit, PaymentDetail } from "../../types/payment";
import { errorMessage, formatDateTime, formatMoney, formatTime } from "../../utils/format";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING_VERIFICATION", label: "Pending Verification" },
  { value: "VERIFIED", label: "Payment Verified" },
  { value: "REJECTED", label: "Payment Rejected" },
];

const AdminPayments = () => {
  const isMobile = useIsMobile();
  // filters
  const [status, setStatus] = useState("PENDING_VERIFICATION");
  const [q, setQ] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [uploadedFrom, setUploadedFrom] = useState("");
  const [uploadedTo, setUploadedTo] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  // bump to force a reload with the current filters
  const [reloadKey, setReloadKey] = useState(0);

  const [rows, setRows] = useState<PaymentDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // detail drawer
  const [selected, setSelected] = useState<PaymentDetail | null>(null);
  const [history, setHistory] = useState<PaymentAudit[]>([]);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [slipLoading, setSlipLoading] = useState(false);
  const [slipError, setSlipError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  // reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await searchPayments({
        status: status || undefined,
        q: q.trim() || undefined,
        travelDate: travelDate || undefined,
        uploadedFrom: uploadedFrom || undefined,
        uploadedTo: uploadedTo || undefined,
        page,
        size,
      });
      setRows(res.data.data.items);
      setTotal(res.data.data.totalItems);
      setError(null);
    } catch (err) {
      setError(await errorMessage(err, "Could not load payments"));
    } finally {
      setLoading(false);
    }
  }, [status, q, travelDate, uploadedFrom, uploadedTo, page, size]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [reloadKey, status, travelDate, uploadedFrom, uploadedTo, page, size]);

  const search = () => {
    setPage(0);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const releaseSlip = () => {
    if (slipUrl) URL.revokeObjectURL(slipUrl);
    setSlipUrl(null);
  };

  const openDetail = async (p: PaymentDetail) => {
    releaseSlip();
    setSelected(p);
    setHistory([]);
    setSlipError(null);
    setSlipLoading(true);
    try {
      const [slip, hist] = await Promise.all([fetchAdminSlip(p.paymentId), getPaymentHistory(p.paymentId)]);
      setSlipUrl(URL.createObjectURL(slip.data));
      setHistory(hist.data.data);
    } catch (err) {
      setSlipError(await errorMessage(err, "Could not load the slip"));
    } finally {
      setSlipLoading(false);
    }
  };

  const closeDetail = () => {
    releaseSlip();
    setSelected(null);
  };

  const refreshSelected = async (updated: PaymentDetail) => {
    setSelected(updated);
    try {
      setHistory((await getPaymentHistory(updated.paymentId)).data.data);
    } catch {
      /* history is secondary */
    }
    setReloadKey((k) => k + 1);
  };

  const approve = () => {
    if (!selected) return;
    Modal.confirm({
      title: "Approve this payment?",
      content: `This confirms booking ${selected.bookingReference} (${formatMoney(selected.amount)}).`,
      okText: "Approve",
      onOk: async () => {
        setActing(true);
        try {
          const res = await approvePayment(selected.paymentId);
          notification.success({ title: "Payment verified", description: "Booking confirmed." });
          await refreshSelected(res.data.data);
        } catch (err) {
          notification.error({ title: "Could not approve", description: await errorMessage(err, "Action failed") });
          setReloadKey((k) => k + 1); // someone else may have already acted
        } finally {
          setActing(false);
        }
      },
    });
  };

  const submitReject = async () => {
    if (!selected) return;
    if (reason.trim().length < 5) {
      setReasonError("Enter a reason of at least 5 characters");
      return;
    }
    setActing(true);
    try {
      const res = await rejectPayment(selected.paymentId, reason.trim());
      notification.success({ title: "Payment rejected", description: "The passenger can upload a corrected slip." });
      setRejectOpen(false);
      setReason("");
      setReasonError(null);
      await refreshSelected(res.data.data);
    } catch (err) {
      setReasonError(await errorMessage(err, "Action failed"));
    } finally {
      setActing(false);
    }
  };

  const columns: ColumnsType<PaymentDetail> = [
    { title: "Payment", dataIndex: "paymentReference", key: "pref" },
    { title: "Booking", dataIndex: "bookingReference", key: "bref" },
    { title: "Passenger", dataIndex: "passengerName", key: "pax" },
    { title: "Route", key: "route", render: (_, p) => `${p.routeSource} → ${p.routeDestination} (Bus ${p.busId})` },
    { title: "Travel", key: "travel", render: (_, p) => `${p.travelDate} ${formatTime(p.departureTime)}` },
    { title: "Amount", key: "amt", render: (_, p) => formatMoney(p.amount) },
    { title: "Uploaded", key: "up", render: (_, p) => formatDateTime(p.uploadedAt) },
    { title: "Status", key: "st", render: (_, p) => <PaymentStatusTag status={p.paymentStatus} /> },
    {
      title: "",
      key: "act",
      render: (_, p) => (
        <Button size="small" onClick={() => void openDetail(p)}>
          Review
        </Button>
      ),
    },
  ];

  const pending = selected?.paymentStatus === "PENDING_VERIFICATION";

  return (
    <div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          value={status}
          options={STATUS_OPTIONS}
          style={{ width: 200 }}
          onChange={(v) => { setStatus(v); setPage(0); setLoading(true); }}
        />
        <Input
          allowClear
          placeholder="Search payment / booking ref, passenger, bus, route"
          style={{ width: 340 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onPressEnter={search}
        />
        <Input type="date" value={travelDate} addonBefore="Travel" onChange={(e) => { setTravelDate(e.target.value); setPage(0); }} />
        <Input type="date" value={uploadedFrom} addonBefore="Uploaded from" onChange={(e) => { setUploadedFrom(e.target.value); setPage(0); }} />
        <Input type="date" value={uploadedTo} addonBefore="to" onChange={(e) => { setUploadedTo(e.target.value); setPage(0); }} />
        <Button type="primary" onClick={search}>Search</Button>
      </Space>

      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 12 }} />}

      {isMobile ? (
        <>
          <div className="sb-list">
            {rows.map((p) => (
              <div key={p.paymentId} className="sb-card sb-pcard">
                <div className="sb-pcard__top"><span>{p.paymentReference}</span><PaymentStatusTag status={p.paymentStatus} /></div>
                <div className="sb-pcard__line">{p.passengerName} · {formatMoney(p.amount)}</div>
                <div className="sb-pcard__line">{p.routeSource} → {p.routeDestination} · {p.travelDate} {formatTime(p.departureTime)}</div>
                <Button size="small" type="primary" onClick={() => void openDetail(p)}>Review</Button>
              </div>
            ))}
            {!loading && rows.length === 0 && <div className="sb-empty"><h3>No payments match these filters</h3></div>}
          </div>
          <Pagination style={{ marginTop: 16 }} align="center" simple current={page + 1} pageSize={size} total={total} onChange={(p, s) => { setPage(p - 1); setSize(s); setLoading(true); }} />
        </>
      ) : (
        <Table<PaymentDetail>
          rowKey="paymentId"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No payments match these filters" }}
          pagination={{
            current: page + 1,
            pageSize: size,
            total,
            showSizeChanger: true,
            onChange: (p, s) => { setPage(p - 1); setSize(s); setLoading(true); },
          }}
        />
      )}

      <Drawer open={selected !== null} onClose={closeDetail} size={isMobile ? "100%" : 720} title={selected ? `Payment ${selected.paymentReference}` : ""} destroyOnHidden>
        {selected && (
          <Space orientation="vertical" size="large" style={{ width: "100%" }}>
            {(selected.transactionReferenceReuseCount > 0 || selected.slipReuseCount > 0) && (
              <Alert
                type="warning"
                showIcon
                title="Possible duplicate evidence"
                description={
                  <>
                    {selected.transactionReferenceReuseCount > 0 && (
                      <div>This transaction reference appears on {selected.transactionReferenceReuseCount} other payment(s).</div>
                    )}
                    {selected.slipReuseCount > 0 && (
                      <div>An identical slip file was uploaded on {selected.slipReuseCount} other payment(s).</div>
                    )}
                  </>
                }
              />
            )}

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Status"><PaymentStatusTag status={selected.paymentStatus} /></Descriptions.Item>
              <Descriptions.Item label="Booking">
                {selected.bookingReference} <BookingStatusTag status={selected.bookingStatus} />
              </Descriptions.Item>
              <Descriptions.Item label="Passenger">
                {selected.passengerName} · {selected.passengerEmail} · {selected.passengerPhone}
              </Descriptions.Item>
              <Descriptions.Item label="Trip">
                {selected.routeSource} → {selected.routeDestination} · Bus {selected.busId} · {selected.travelDate} {formatTime(selected.departureTime)} · Seat {selected.seatNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Expected amount">{formatMoney(selected.amount)}</Descriptions.Item>
              <Descriptions.Item label="Transaction reference">{selected.transactionReference}</Descriptions.Item>
              <Descriptions.Item label="Method">{selected.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Uploaded">
                {formatDateTime(selected.uploadedAt)}
                {selected.resubmissionCount > 0 ? ` (resubmitted ${selected.resubmissionCount}×)` : ""}
              </Descriptions.Item>
              {selected.verifiedByUsername && (
                <Descriptions.Item label="Reviewed by">
                  {selected.verifiedByUsername} · {formatDateTime(selected.verifiedAt)}
                </Descriptions.Item>
              )}
              {selected.rejectionReason && (
                <Descriptions.Item label="Rejection reason">{selected.rejectionReason}</Descriptions.Item>
              )}
            </Descriptions>

            <div>
              <Typography.Title level={5}>Payment slip</Typography.Title>
              <SlipViewer url={slipUrl} contentType={selected.slipContentType} loading={slipLoading} error={slipError} />
            </div>

            {pending && (
              <Space>
                <Button type="primary" loading={acting} onClick={approve}>Approve</Button>
                <Button danger disabled={acting} onClick={() => { setReason(""); setReasonError(null); setRejectOpen(true); }}>
                  Reject…
                </Button>
              </Space>
            )}

            <div>
              <Typography.Title level={5}>History</Typography.Title>
              <Timeline
                items={history.map((h) => ({
                  content: `${h.action} by ${h.actorType.toLowerCase()} #${h.actorId} · ${formatDateTime(h.createdAt)}${h.note ? ` — ${h.note}` : ""}`,
                }))}
              />
            </div>
          </Space>
        )}
      </Drawer>

      <Modal
        open={rejectOpen}
        title="Reject payment"
        okText="Reject payment"
        okButtonProps={{ danger: true, loading: acting }}
        onOk={() => void submitReject()}
        onCancel={() => setRejectOpen(false)}
        destroyOnHidden
      >
        <Typography.Paragraph>The passenger will see this reason and can upload a corrected slip.</Typography.Paragraph>
        <Input.TextArea rows={4} maxLength={500} showCount value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Amount on the slip does not match the fare" />
        {reasonError && <Alert type="error" showIcon title={reasonError} style={{ marginTop: 8 }} />}
      </Modal>
    </div>
  );
};

export default AdminPayments;
