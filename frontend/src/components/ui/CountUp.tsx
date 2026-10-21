import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
export default function CountUp({ value, money = false }: { value: number; money?: boolean }) {
 const el = useRef<HTMLSpanElement>(null); const previous = useRef(value); const reduced = useReducedMotion();
 const format = (n: number) => (money ? "LKR " : "") + n.toLocaleString("en-LK", { maximumFractionDigits: money ? 2 : 0, minimumFractionDigits: money ? 2 : 0 });
 useEffect(() => {
   let frame = 0; const start = performance.now(); const from = previous.current;
   const tick = (now: number) => { const progress = reduced ? 1 : Math.min((now - start) / 280, 1); const current = from + (value - from) * (1 - (1 - progress) ** 3); if (el.current) el.current.textContent = (money ? "LKR " : "") + current.toLocaleString("en-LK", { maximumFractionDigits: money ? 2 : 0, minimumFractionDigits: money ? 2 : 0 }); if (progress < 1) frame = requestAnimationFrame(tick); };
   frame = requestAnimationFrame(tick); previous.current = value; return () => cancelAnimationFrame(frame);
 }, [value, money, reduced]);
 return <span className="count-up" aria-label={format(value)}><span aria-hidden="true" ref={el}>{format(value)}</span></span>;
}
