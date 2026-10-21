import { m, useReducedMotion } from "motion/react";
import SlipPreview from "../../components/ui/SlipPreview";
import Toast from "../../components/ui/Toast";
import { useCallback, useEffect, useState, useRef } from "react";
import { Alert, Button, Input, Progress, Skeleton, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import SeatMap from "../../components/booking/SeatMap";
import BookingStepper from "../../components/booking/BookingStepper";
import { BookingSummary, SummaryBar } from "../../components/booking/BookingSummary";
import PaymentMethodSelector from "../../components/booking/PaymentMethodSelector";
import AuthRequiredModal from "../../components/booking/AuthRequiredModal";
import EmptyState from "../../components/common/EmptyState";
import { SITE } from "../../config/site";
import {
  createBooking,
  getRoutes,
  getScheduleSeats,
  getSchedules,
  type SeatItem,
  type TripResult,
} from "../../services/bookingService";
import { getMyBookings, uploadPaymentSlip } from "../../services/paymentService";
import { errorMessage, formatMoney, formatTime } from "../../utils/format";
import { formatLongDate, isBookable } from "../../utils/dates";
import { getRole, isAuthenticated } from "../../utils/auth";
import { ROUTES } from "../../types/routes";

type Step = "seats" | "passengers" | "payment" | "done";
const STEP_INDEX: Record<Step, number> = { seats: 1, passengers: 2, payment: 3, done: 4 };

interface Created {
  seat: SeatItem;
  reference: string;
  bookingId: number | null;
  amount: number | null;
  slipDone: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];
const PHONE = /^(\+94|0)?\d{9,10}$/;
const selKey = (id: string) => `sb:sel:${id}`;
const resumeKey = (id: string) => `sb:resume:${id}`;

const BookingFlowPage = () => {
  const { scheduleId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<TripResult | null>((location.state as { trip?: TripResult } | null)?.trip ?? null);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("seats");
  const reduced = useReducedMotion();
  const previousStep = useRef(1);
  const direction = STEP_INDEX[step] >= previousStep.current ? 1 : -1;
  useEffect(() => { previousStep.current = STEP_INDEX[step]; }, [step]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const [names, setNames] = useState<Record<number, string>>({});
  const [phone, setPhone] = useState("");
  const [paxErrors, setPaxErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [created, setCreated] = useState<Created[]>([]);
  const [txn, setTxn] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [payError, setPayError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      let t = trip;
      if (!t) {
        const [r, s] = await Promise.all([getRoutes(), getSchedules()]);
        const sch = s.data.data.find((x) => String(x.scheduleId) === scheduleId);
        const route = sch && r.data.data.find((x) => x.routeId === sch.routeId);
        if (!sch || !route || (sch.price ?? 0) <= 0) {
          setLoadError("This trip could not be found or is not open for booking.");
          return;
        }
        t = {
          scheduleId: sch.scheduleId, routeId: sch.routeId, source: route.source, destination: route.destination,
          busId: sch.busId, travelDate: sch.travelDate, departureTime: sch.departureTime, price: sch.price as number,
          totalSeats: 0, availableSeats: 0,
        };
        setTrip(t);
      }
      if (!isBookable(t.travelDate, t.departureTime)) {
        setLoadError("Bookings close 1 hour before departure (Sri Lanka time). Please choose a later bus.");
        return;
      }
      const res = await getScheduleSeats(t.scheduleId);
      const list = res.data.data;
      setSeats(list);
      setLoadError(null);

      // restore a selection saved before a login redirect (only seats that are still free)
      const saved = sessionStorage.getItem(selKey(scheduleId));
      if (saved) {
        sessionStorage.removeItem(selKey(scheduleId));
        const wanted = JSON.parse(saved) as number[];
        const ids = wanted.filter((id) => list.some((s) => s.seatId === id && !s.booked));
        const lost = wanted
          .filter((id) => !ids.includes(id))
          .map((id) => list.find((s) => s.seatId === id)?.seatNumber ?? String(id));
        const resume = sessionStorage.getItem(resumeKey(scheduleId)) === "1";
        sessionStorage.removeItem(resumeKey(scheduleId));
        setSelectedIds(ids);
        if (lost.length > 0) {
          // another passenger took it while this visitor was signing in
          setNotice(`Seat ${lost.join(", ")} is no longer available. Please choose another seat.`);
        } else if (resume && ids.length > 0 && isAuthenticated() && getRole() === "PASSENGER") {
          setStep("passengers"); // nothing is booked yet: the passenger still has to confirm explicitly
        }
      }
    } catch (err) {
      setLoadError(await errorMessage(err, "Could not load this trip's seats."));
    } finally {
      setLoading(false);
    }
  }, [trip, scheduleId]);

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  const selected = seats.filter((s) => selectedIds.includes(s.seatId));
  const max = SITE.maxSeatsPerBooking;

  const toggle = (seat: SeatItem) => {
    setNotice(null);
    setSelectedIds((ids) => (ids.includes(seat.seatId) ? ids.filter((i) => i !== seat.seatId) : [...ids, seat.seatId]));
  };

  const rememberSelection = () => {
    sessionStorage.setItem(selKey(scheduleId), JSON.stringify(selectedIds));
    sessionStorage.setItem(resumeKey(scheduleId), "1");
  };

  const goAuth = (path: string) => {
    rememberSelection();
    navigate(path, { state: { from: location.pathname } });
  };

  const continueToPassengers = async () => {
    // Frontend gate (UX only). The backend independently rejects anonymous booking requests with 401.
    if (!isAuthenticated() || getRole() !== "PASSENGER") {
      setAuthOpen(true);
      return;
    }
    // Re-check live availability before asking for passenger details
    setChecking(true);
    try {
      const fresh = (await getScheduleSeats(trip?.scheduleId ?? Number(scheduleId))).data.data;
      setSeats(fresh);
      const lost = selected.filter((s) => fresh.find((f) => f.seatId === s.seatId)?.booked);
      if (lost.length > 0) {
        setSelectedIds((ids) => ids.filter((id) => !lost.some((l) => l.seatId === id)));
        setNotice(`Seat ${lost.map((l) => l.seatNumber).join(", ")} was just booked by another passenger. Please choose another seat.`);
        return;
      }
      setStep("passengers");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setNotice(await errorMessage(err, "Could not check seat availability. Please try again."));
    } finally {
      setChecking(false);
    }
  };

  const validatePassengers = () => {
    const errs: Record<string, string> = {};
    selected.forEach((s) => {
      if ((names[s.seatId] ?? "").trim().length < 2) errs[`n${s.seatId}`] = "Enter the passenger's full name";
    });
    if (!PHONE.test(phone.replace(/[\s-]/g, ""))) errs.phone = "Enter a valid phone number, e.g. 0771234567";
    setPaxErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const reserve = async () => {
    if (!trip || !validatePassengers()) return;
    setCreating(true);
    setCreateError(null);

    const ok: { seat: SeatItem; reference: string }[] = [];
    const failed: { seat: SeatItem; msg: string }[] = [];
    for (const seat of selected) {
      try {
        const res = await createBooking({
          scheduleId: trip.scheduleId,
          seatId: seat.seatId,
          passengerName: (names[seat.seatId] ?? "").trim(),
          phoneNumber: phone.replace(/[\s-]/g, ""),
        });
        ok.push({ seat, reference: res.data.data });
      } catch (err) {
        failed.push({ seat, msg: await errorMessage(err, "could not be reserved") });
      }
    }

    if (ok.length === 0) {
      setCreateError(`${failed[0]?.msg ?? "Reservation failed"}. Please review the seat map and try again.`);
      setSelectedIds([]);
      setStep("seats");
      setCreating(false);
      void loadAll();
      return;
    }

    // the reserve response only carries a reference; read amounts and ids back from the server
    let rows: Created[] = ok.map((o) => ({ seat: o.seat, reference: o.reference, bookingId: null, amount: null, slipDone: false }));
    try {
      const mine = (await getMyBookings()).data.data;
      rows = rows.map((r) => {
        const m = mine.find((b) => b.bookingReference === r.reference);
        return m ? { ...r, bookingId: m.bookingId, amount: m.amount } : r;
      });
    } catch {
      /* handled below: payment step blocks upload until ids are known */
    }
    setCreated(rows);
    if (failed.length > 0) {
      setNotice(`Seat ${failed.map((f) => f.seat.seatNumber).join(", ")} could not be reserved (${failed[0].msg}). The other seats are held for you.`);
    }
    setStep("payment");
    setCreating(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pick = (f: File) => {
    if (!ALLOWED.includes(f.type)) setPayError("Only JPG, PNG or PDF files are allowed");
    else if (f.size > MAX_BYTES) setPayError("File is too large. Maximum size is 5 MB");
    else { setPayError(null); setFile(f); }
    return false;
  };

  const submitSlip = async () => {
    if (!file) return;
    if (txn.trim().length < 4) { setPayError("Enter the bank transaction reference (at least 4 characters)"); return; }
    if (created.some((c) => c.bookingId === null)) { setPayError("Booking details are still loading. Please open My Bookings to upload your slip."); return; }

    setUploading(true);
    setPayError(null);
    const todo = created.filter((c) => !c.slipDone);
    let done = 0;
    let firstError: string | null = null;
    const updated = [...created];

    for (const c of todo) {
      try {
        await uploadPaymentSlip(c.bookingId as number, txn.trim(), file, pct => setUploadPct(Math.round((done * 100 + pct) / todo.length)));
        updated[updated.findIndex((x) => x.reference === c.reference)] = { ...c, slipDone: true };
      } catch (err) {
        firstError ??= `${c.reference}: ${await errorMessage(err, "upload failed")}`;
      }
      done += 1;
      setUploadPct(Math.round((done * 100) / todo.length));
    }

    setCreated(updated);
    setUploading(false);
    if (updated.every((c) => c.slipDone)) {
      setStep("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setPayError(`Some slips could not be submitted - ${firstError}. You can retry.`);
    }
  };

  if (loading) {
    return <div className="sb-container sb-section"><Skeleton active paragraph={{ rows: 8 }} /></div>;
  }

  if (loadError || !trip) {
    return (
      <div className="sb-container sb-section">
        <EmptyState
          title="Trip unavailable"
          description={loadError ?? "This trip could not be loaded."}
          action={<Link to={ROUTES.SEARCH}><Button type="primary">Search buses</Button></Link>}
        />
      </div>
    );
  }

  const totalCreated = created.reduce((sum, c) => sum + (c.amount ?? trip.price), 0);

  return (
    <div className="sb-container" style={{ paddingTop: 24 }}>
      <BookingStepper current={STEP_INDEX[step]} />

      <div className="sb-book-layout">
        <m.div key={step} className="sb-stack" initial={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : 12 * direction }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .28 }}>
          {notice && <Toast text={notice} onClose={() => setNotice(null)}/>}
          {createError && <Alert type="error" showIcon closable title={createError} onClose={() => setCreateError(null)} />}

          {step === "seats" && (
            <>
              <div>
                <h1 style={{ fontSize: "1.6rem" }}>Choose your seats</h1>
                <p className="sb-muted" style={{ marginTop: 4 }}>
                  {trip.source} → {trip.destination} · {formatLongDate(trip.travelDate)} · {formatTime(trip.departureTime)}
                </p>
                <p className="sb-muted">Select up to {max} seats. Tap a selected seat again to remove it.</p>
              </div>
              <SeatMap seats={seats} selectedIds={selectedIds} maxSeats={max} onToggle={toggle} onLimit={() => setNotice(`You can select up to ${max} seats per booking.`)} />
              <Button type="link" onClick={() => void loadAll()} style={{ alignSelf: "flex-start" }}>Refresh availability</Button>
            </>
          )}

          {step === "passengers" && (
            <>
              <h1 style={{ fontSize: "1.6rem" }}>Passenger details</h1>
              <div className="sb-card sb-pax">
                <div className="sb-field">
                  <label htmlFor="pax-phone">Contact phone number</label>
                  <Input id="pax-phone" inputMode="tel" autoComplete="tel" placeholder="0771234567" value={phone} status={paxErrors.phone ? "error" : undefined} onChange={(e) => setPhone(e.target.value)} />
                  {paxErrors.phone && <span className="sb-field__error" role="alert">{paxErrors.phone}</span>}
                </div>
              </div>
              {selected.map((s) => (
                <div key={s.seatId} className="sb-card sb-pax">
                  <span className="sb-pax__seat"><span className="sb-tag">Seat {s.seatNumber}</span></span>
                  <div className="sb-field">
                    <label htmlFor={`pax-${s.seatId}`}>Passenger full name</label>
                    <Input id={`pax-${s.seatId}`} autoComplete="name" value={names[s.seatId] ?? ""} status={paxErrors[`n${s.seatId}`] ? "error" : undefined} onChange={(e) => setNames((n) => ({ ...n, [s.seatId]: e.target.value }))} />
                    {paxErrors[`n${s.seatId}`] && <span className="sb-field__error" role="alert">{paxErrors[`n${s.seatId}`]}</span>}
                  </div>
                </div>
              ))}
              <Alert type="info" showIcon title="Your seats are held until payment is verified" description="Reserving takes the seats off sale for other passengers. Upload your payment slip on the next step." />
              <div className="sb-step-actions">
                <Button onClick={() => setStep("seats")} disabled={creating}>Back to seats</Button>
              </div>
            </>
          )}

          {step === "payment" && (
            <>
              <h1 style={{ fontSize: "1.6rem" }}>Payment</h1>
              <div className="sb-card sb-pax">
                <strong>Reserved seats</strong>
                {created.map((c) => (
                  <div key={c.reference} className="sb-row" style={{ justifyContent: "space-between" }}>
                    <span>Seat {c.seat.seatNumber} · {c.reference}</span>
                    <span>{c.slipDone ? "✓ slip submitted" : formatMoney(c.amount ?? trip.price)}</span>
                  </div>
                ))}
                <div className="sb-summary__total"><span>Amount to transfer</span><span>{formatMoney(totalCreated)}</span></div>
              </div>

              <PaymentMethodSelector />

              <div className="sb-card sb-pax">
                <strong>Upload your payment slip</strong>
                <div className="sb-field">
                  <label htmlFor="pay-txn">Bank transaction reference</label>
                  <Input id="pay-txn" maxLength={100} value={txn} onChange={(e) => setTxn(e.target.value)} />
                </div>
                <Upload.Dragger accept=".jpg,.jpeg,.png,.pdf" maxCount={1} beforeUpload={pick} onRemove={() => setFile(null)} fileList={file ? [{ uid: "1", name: file.name, status: "done" }] : []}>
                  <Button icon={<UploadOutlined />}>Choose slip (JPG, PNG, PDF - max 5 MB)</Button>
                </Upload.Dragger><SlipPreview file={file}/>
                {created.length > 1 && <p className="sb-muted" style={{ fontSize: "0.85rem" }}>This slip will be attached to all {created.length} reserved seats.</p>}
                {uploading && <Progress percent={uploadPct} />}
                {payError && <Alert type="error" showIcon title={payError} />}
              </div>

              <div className="sb-step-actions">
                <Button onClick={() => navigate(ROUTES.PASSENGER_BOOKINGS)} disabled={uploading}>Pay later</Button>
                <Button type="primary" size="large" disabled={!file} loading={uploading} onClick={() => void submitSlip()}>Submit payment slip</Button>
              </div>
              <p className="sb-muted" style={{ fontSize: "0.85rem" }}>“Pay later” keeps your seats held; you can upload the slip from My Bookings.</p>
            </>
          )}

          {step === "done" && (
            <div className="sb-card sb-done">
              <div className="sb-done__icon" aria-hidden="true">✓</div>
              <h1 style={{ fontSize: "1.6rem" }}>Payment slip submitted</h1>
              <p className="sb-muted" style={{ margin: "8px auto 20px", maxWidth: 460 }}>
                Your booking is <strong>awaiting verification</strong>. It will be confirmed once an administrator approves your payment.
                You can follow the status in My Bookings.
              </p>
              <div className="sb-stack" style={{ maxWidth: 420, margin: "0 auto 24px", textAlign: "left" }}>
                {created.map((c) => (
                  <div key={c.reference} className="sb-row" style={{ justifyContent: "space-between" }}>
                    <span><strong>{c.reference}</strong> · Seat {c.seat.seatNumber}</span>
                    <span className="sb-tag sb-tag--warn">Pending verification</span>
                  </div>
                ))}
              </div>
              <div className="sb-row" style={{ justifyContent: "center" }}>
                <Link to={ROUTES.PASSENGER_BOOKINGS}><Button type="primary" size="large">View my bookings</Button></Link>
                <Link to={ROUTES.SEARCH}><Button size="large">Book another trip</Button></Link>
              </div>
            </div>
          )}
        </m.div>

        {step === "seats" && (
          <>
            <BookingSummary trip={trip} selected={selected} continueLabel="Continue to Booking" onContinue={() => void continueToPassengers()} loading={checking} />
            <SummaryBar trip={trip} selected={selected} continueLabel="Continue" onContinue={() => void continueToPassengers()} loading={checking} />
          </>
        )}
        {step === "passengers" && (
          <>
            <BookingSummary trip={trip} selected={selected} continueLabel="Reserve seats & continue" onContinue={() => void reserve()} loading={creating} />
            <SummaryBar trip={trip} selected={selected} continueLabel="Reserve & pay" onContinue={() => void reserve()} loading={creating} />
          </>
        )}
      </div>

      <AuthRequiredModal
        open={authOpen}
        trip={trip}
        seats={selected}
        onClose={() => setAuthOpen(false)}
        onLogin={() => goAuth(ROUTES.LOGIN)}
        onRegister={() => goAuth(ROUTES.PASSENGER_REGISTER)}
      />
    </div>
  );
};

export default BookingFlowPage;
