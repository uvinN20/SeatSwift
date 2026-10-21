import { Alert, Empty, Spin } from "antd";

interface Props {
  url: string | null;
  contentType: string | null;
  loading: boolean;
  error: string | null;
}

/** Renders an already-fetched slip (blob object URL). Fetching is done by the caller with the auth header. */
const SlipViewer = ({ url, contentType, loading, error }: Props) => {
  if (loading) return <Spin />;
  if (error) return <Alert type="error" title={error} showIcon />;
  if (!url) return <Empty description="No slip loaded" />;

  if (contentType === "application/pdf") {
    return (
      <iframe
        src={url}
        title="Payment slip"
        style={{ width: "100%", height: 480, border: "1px solid #eee" }}
      />
    );
  }

  return (
    <img
      src={url}
      alt="Payment slip"
      style={{ maxWidth: "100%", maxHeight: 520, display: "block", margin: "0 auto" }}
    />
  );
};

export default SlipViewer;
