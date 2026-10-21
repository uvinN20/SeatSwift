import { Tag } from "antd";
import type { BookingStatus, PaymentStatus } from "../../types/payment";
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "../../utils/format";

export const PaymentStatusTag = ({ status }: { status: PaymentStatus }) => {
  const s = PAYMENT_STATUS_LABEL[status];
  return <Tag color={s.color}>{s.label}</Tag>;
};

export const BookingStatusTag = ({ status }: { status: BookingStatus }) => {
  const s = BOOKING_STATUS_LABEL[status];
  return <Tag color={s.color}>{s.label}</Tag>;
};
