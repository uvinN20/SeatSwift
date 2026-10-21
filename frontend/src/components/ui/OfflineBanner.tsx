import { useEffect, useState } from "react";
export default function OfflineBanner() {
 const [online, setOnline] = useState(navigator.onLine);
 useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
 return online ? null : <div className="offline-banner" role="status">You’re offline. Reconnect before searching, reserving seats or uploading a slip.</div>;
}
