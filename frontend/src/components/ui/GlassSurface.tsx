import type { HTMLAttributes } from "react";
export default function GlassSurface({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
 return <div className={`glass ${className}`} {...props} />;
}
