import { Alert } from "antd";
export default function Toast({ text, onClose }: { text: string; onClose?: () => void }) {
 return <div className="notice-toast" role="status" aria-live="polite"><Alert type="warning" showIcon closable={!!onClose} title={text} onClose={onClose}/></div>;
}
