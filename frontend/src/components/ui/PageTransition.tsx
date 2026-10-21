import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
export default function PageTransition({ children, id }: { children: ReactNode; id: string }) {
 const reduced = useReducedMotion();
 return <m.div key={id} initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28 }} className="page-transition">{children}</m.div>;
}
