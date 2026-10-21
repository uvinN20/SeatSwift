import type { ReactNode } from "react";
import Brand from "../common/Brand";
import Picture from "../ui/Picture";
import ThemeToggle from "../ui/ThemeToggle";
export default function AuthShell({ heading, blurb, children }: { heading: string; blurb: string; children: ReactNode }) {
 return <div className="sb-auth"><section className="sb-auth__panel"><Picture name="auth" priority/><div className="auth-scrim"/><Brand/><div className="auth-story"><span className="sb-eyebrow">Every seat, a new story</span><h2>{heading}</h2><p>{blurb}</p></div><span className="auth-caption">SRI LANKA · YOUR JOURNEY STARTS HERE</span></section><main className="sb-auth__form"><div className="auth-tools"><Brand/><ThemeToggle/></div><div className="sb-auth__card page-enter">{children}</div></main></div>;
}
