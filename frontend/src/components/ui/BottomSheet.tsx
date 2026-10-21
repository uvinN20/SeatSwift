import { Drawer } from "antd";
import { m, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
export default function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
 const [expanded, setExpanded] = useState(false); const reduced = useReducedMotion();
 return <Drawer open={open} onClose={onClose} placement="bottom" height={expanded ? "90svh" : "70svh"} title={title} className="premium-sheet" destroyOnHidden>
   <m.button className="sheet-grabber" aria-label={expanded ? "Reduce sheet height" : "Expand sheet"} onClick={() => setExpanded(v => !v)} drag={reduced ? false : "y"} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={.4} onDragEnd={(_, info) => { if (info.offset.y > 75 || info.velocity.y > 700) onClose(); else if (info.offset.y < -35) setExpanded(true); }}><span /></m.button>
   {children}
 </Drawer>;
}
