import SlipPreview from "../ui/SlipPreview";
import { useState } from "react";
import { Alert, Button, Input, Modal, Progress, Typography, Upload, notification } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { PassengerBooking } from "../../types/payment";
import { uploadPaymentSlip } from "../../services/paymentService";
import { errorMessage, formatMoney } from "../../utils/format";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

interface Props {
  booking: PassengerBooking | null;
  onClose: () => void;
  onUploaded: () => void;
}

const SlipUploadModal = ({ booking, onClose, onUploaded }: Props) => {
  const [txn, setTxn] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTxn("");
    setFile(null);
    setProgress(0);
    setError(null);
    setSubmitting(false);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const pick = (f: File) => {
    // Client-side checks are only a convenience; the server re-validates type, size and content.
    if (!ALLOWED.includes(f.type)) {
      setError("Only JPG, PNG or PDF files are allowed");
    } else if (f.size > MAX_BYTES) {
      setError("File is too large. Maximum size is 5 MB");
    } else {
      setError(null);
      setFile(f);
    }
    return false; // prevent antd's automatic upload
  };

  const submit = async () => {
    if (!booking || !file) return;
    if (txn.trim().length < 4) {
      setError("Enter the bank transaction reference (at least 4 characters)");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await uploadPaymentSlip(booking.bookingId, txn.trim(), file, setProgress);
      notification.success({
        title: "Slip submitted",
        description: "An administrator will verify your payment shortly.",
      });
      reset();
      onUploaded();
    } catch (err) {
      setError(await errorMessage(err, "Upload failed. Please try again."));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={booking !== null}
      title={booking?.paymentStatus === "REJECTED" ? "Upload corrected payment slip" : "Upload payment slip"}
      onCancel={close}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={close} disabled={submitting}>
          Cancel
        </Button>,
        <Button key="ok" type="primary" onClick={submit} loading={submitting} disabled={!file}>
          Submit slip
        </Button>,
      ]}
    >
      {booking && (
        <>
          <Typography.Paragraph>
            Booking <b>{booking.bookingReference}</b> &middot; amount to pay{" "}
            <b>{formatMoney(booking.amount)}</b>. Transfer the exact amount to the bank
            account provided by the operator, then upload the slip here.
          </Typography.Paragraph>

          {booking.paymentStatus === "REJECTED" && booking.rejectionReason && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              title="Previous slip was rejected"
              description={booking.rejectionReason}
            />
          )}

          <Input
            aria-label="Bank transaction reference" placeholder="Bank transaction reference"
            value={txn}
            maxLength={100}
            onChange={(e) => setTxn(e.target.value)}
            style={{ marginBottom: 12 }}
          />

          <Upload.Dragger
            accept=".jpg,.jpeg,.png,.pdf"
            maxCount={1}
            beforeUpload={pick}
            onRemove={() => setFile(null)}
            fileList={file ? [{ uid: "1", name: file.name, status: "done" }] : []}
          >
            <Button icon={<UploadOutlined />}>Choose slip (JPG, PNG, PDF - max 5 MB)</Button>
          </Upload.Dragger><SlipPreview file={file}/>

          {submitting && <Progress percent={progress} style={{ marginTop: 12 }} />}
          {error && <Alert type="error" showIcon title={error} style={{ marginTop: 12 }} />}
        </>
      )}
    </Modal>
  );
};

export default SlipUploadModal;
