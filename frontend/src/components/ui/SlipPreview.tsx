import { useEffect, useState } from "react";
export default function SlipPreview({ file }: { file: File | null }) {
 const [url, setUrl] = useState("");
 useEffect(() => { if (!file) { setUrl(""); return; } const object = URL.createObjectURL(file); setUrl(object); return () => URL.revokeObjectURL(object); }, [file]);
 if (!file || !url) return null;
 return <div className="slip-preview">{file.type.startsWith("image/") ? <img src={url} alt={`Selected payment slip: ${file.name}`}/> : <a href={url} target="_blank" rel="noreferrer">Preview selected PDF ↗</a>}<p>{file.name} · {(file.size / 1024).toFixed(0)} KB</p></div>;
}
