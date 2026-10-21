export default function CapacityRing({ available, total }: { available: number; total: number }) {
 const fraction = total > 0 ? Math.max(0, Math.min(1, available / total)) : 0;
 return <div className="capacity" role="img" aria-label={`${available} of ${total} seats available`}>
   <svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="23" className="capacity-track"/><circle cx="28" cy="28" r="23" className="capacity-value" strokeDasharray={`${fraction * 144.51} 144.51`} transform="rotate(-90 28 28)"/><text x="28" y="32" textAnchor="middle">{available}</text></svg>
   <span>of {total}<br/>seats free</span>
 </div>;
}
