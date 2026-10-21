export default function RouteLine({ active = false, reverse = false }: { active?: boolean; reverse?: boolean }) {
 return <svg className={`route-line ${active ? "is-active" : ""} ${reverse ? "is-reversed" : ""}`} viewBox="0 0 280 40" aria-hidden="true">
   <circle cx="8" cy="20" r="5" fill="currentColor"/><path d="M20 20H260" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 7"/>
   <circle cx="272" cy="20" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
   <g className="route-bus" fill="var(--surface)"><rect x="128" y="10" width="25" height="17" rx="5" stroke="currentColor" strokeWidth="2"/><path d="M133 15h15M133 20h3m9 0h3" stroke="currentColor" strokeWidth="2"/><circle cx="134" cy="28" r="2" fill="currentColor"/><circle cx="148" cy="28" r="2" fill="currentColor"/></g>
 </svg>;
}
