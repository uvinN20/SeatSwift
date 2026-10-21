import type { ReactNode } from "react";
export default function Widget({ children, label, className = "" }: { children: ReactNode; label?: string; className?: string }) {
 return <section className={`widget ${className}`} aria-label={label}>{label && <div className="widget-label">{label}</div>}{children}</section>;
}
