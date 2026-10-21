import api from "./api";
import type {
  ApiEnvelope,
  Paged,
  PassengerBooking,
  PaymentAudit,
  PaymentDetail,
  PaymentSearchParams,
} from "../types/payment";

// ---- passenger ----
export const getMyBookings = () =>
  api.get<ApiEnvelope<PassengerBooking[]>>("/passenger/bookings");

export const uploadPaymentSlip = (
  bookingId: number,
  transactionReference: string,
  file: File,
  onProgress?: (percent: number) => void,
) => {
  const form = new FormData();
  form.append("transactionReference", transactionReference);
  form.append("file", file);

  // The instance default is application/json; multipart must be requested explicitly.
  return api.post<ApiEnvelope<PaymentDetail>>(
    `/passenger/bookings/${bookingId}/payment`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    },
  );
};

export const fetchMySlip = (bookingId: number) =>
  api.get<Blob>(`/passenger/bookings/${bookingId}/payment/slip`, {
    responseType: "blob",
  });

// ---- admin ----
export const searchPayments = (params: PaymentSearchParams) =>
  api.get<ApiEnvelope<Paged<PaymentDetail>>>("/admin/payments", { params });

export const getPayment = (paymentId: number) =>
  api.get<ApiEnvelope<PaymentDetail>>(`/admin/payments/${paymentId}`);

export const fetchAdminSlip = (paymentId: number) =>
  api.get<Blob>(`/admin/payments/${paymentId}/slip`, { responseType: "blob" });

export const approvePayment = (paymentId: number) =>
  api.post<ApiEnvelope<PaymentDetail>>(`/admin/payments/${paymentId}/approve`);

export const rejectPayment = (paymentId: number, reason: string) =>
  api.post<ApiEnvelope<PaymentDetail>>(`/admin/payments/${paymentId}/reject`, {
    reason,
  });

export const getPaymentHistory = (paymentId: number) =>
  api.get<ApiEnvelope<PaymentAudit[]>>(`/admin/payments/${paymentId}/history`);

// ---- admin: reservations (existing endpoint) ----
export interface AdminBooking {
  bookingId: number;
  scheduleId: number;
  seatId: number;
  passengerId: number | null;
  passengerName: string;
  phoneNumber: string;
  bookingReference: string;
  bookingStatus: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";
  amount: number;
}

export const getAdminBookings = () => api.get<ApiEnvelope<AdminBooking[]>>("/admin/bookings");
