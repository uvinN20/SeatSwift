export interface ApiEnvelope<T> {
  status: string;
  returnCode: string;
  description: string;
  data: T;
}

export interface Paged<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export type BookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";
export type PaymentStatus =
  | "NOT_SUBMITTED"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export interface PassengerBooking {
  bookingId: number;
  bookingReference: string;
  bookingStatus: BookingStatus;
  amount: number;
  scheduleId: number;
  busId: number;
  routeSource: string;
  routeDestination: string;
  travelDate: string;
  departureTime: string;
  seatNumber: string;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  slipUploadedAt: string | null;
  rejectionReason: string | null;
  canUploadSlip: boolean;
}

export interface PaymentDetail {
  paymentId: number;
  paymentReference: string;
  paymentStatus: Exclude<PaymentStatus, "NOT_SUBMITTED">;
  amount: number;
  transactionReference: string;
  paymentMethod: string;
  slipContentType: string;
  uploadedAt: string;
  verifiedByUsername: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  resubmissionCount: number;
  transactionReferenceReuseCount: number;
  slipReuseCount: number;
  bookingId: number;
  bookingReference: string;
  bookingStatus: BookingStatus;
  passengerId: number;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  scheduleId: number;
  busId: number;
  routeId: number;
  routeSource: string;
  routeDestination: string;
  travelDate: string;
  departureTime: string;
  seatNumber: string;
}

export interface PaymentAudit {
  auditId: number;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  actorType: string;
  actorId: number;
  note: string | null;
  createdAt: string;
}

export interface PaymentSearchParams {
  status?: string;
  q?: string;
  travelDate?: string;
  uploadedFrom?: string;
  uploadedTo?: string;
  page: number;
  size: number;
}
