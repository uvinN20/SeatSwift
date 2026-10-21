import type { PaymentStatus } from "../../types/payment";
const labels: Record<PaymentStatus, string> = { NOT_SUBMITTED: "Awaiting payment slip", PENDING_VERIFICATION: "Awaiting verification", VERIFIED: "Payment verified", REJECTED: "Payment slip rejected" };
export default function PaymentWidget({ status, reason }: { status: PaymentStatus; reason?: string | null }) {
 return <div className={`payment-widget payment-${status.toLowerCase()}`}><span className="payment-orbit" aria-hidden="true">{status === "VERIFIED" ? "✓" : status === "REJECTED" ? "!" : "◷"}</span><div><small>PAYMENT STATUS</small><strong>{labels[status]}</strong>{status === "REJECTED" && reason && <p>{reason}</p>}</div></div>;
}
