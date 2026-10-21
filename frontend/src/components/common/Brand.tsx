import { Link } from "react-router-dom";

import { SITE } from "../../config/site";

const Brand = ({ light = false, to = "/" }: { light?: boolean; to?: string }) => (
  <Link to={to} className={`sb-brand ${light ? "sb-brand--light" : ""}`} aria-label={`${SITE.name} home`}>
    <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="6" y="4" width="20" height="23" rx="6"/><path d="M7 17h18M11 9h10M11 22h2m6 0h2M10 27v2m12-2v2"/></svg></span>
    <span>{SITE.name}</span>
  </Link>
);

export default Brand;
