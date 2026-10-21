import axios from "axios";
import type { BookingStatus, PaymentStatus } from "../types/payment";

export const formatMoney = (value: number | null | undefined): string =>
  value == null
    ? "-"
    : new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(value);

export const formatTime = (t: string): string => t.slice(0, 5);

export const formatDateTime = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleString() : "-";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, { label: string; color: string }> = {
  NOT_SUBMITTED: { label: "Slip Not Uploaded", color: "default" },
  PENDING_VERIFICATION: { label: "Pending Verification", color: "gold" },
  VERIFIED: { label: "Payment Verified", color: "green" },
  REJECTED: { label: "Payment Rejected", color: "red" },
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Awaiting Payment", color: "gold" },
  CONFIRMED: { label: "Booking Confirmed", color: "green" },
  CANCELLED: { label: "Booking Cancelled", color: "default" },
};

// Pulls the backend's `description` out of an axios error (blob responses included).
export const errorMessage = async (err: unknown, fallback: string): Promise<string> => {
  if (axios.isAxiosError(err)) {
    const data: unknown = err.response?.data;
    if (data instanceof Blob) {
      try {
        const parsed = JSON.parse(await data.text());
        return parsed.description ?? fallback;
      } catch {
        return fallback;
      }
    }
    if (data && typeof data === "object" && "description" in data) {
      return String((data as { description: unknown }).description);
    }
  }
  return fallback;
};
