import PageTransition from "../ui/PageTransition";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

const PublicLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="sb-main page-enter" key={pathname}>
        <PageTransition id={pathname}><Outlet /></PageTransition>
      </main>
      <SiteFooter />
    </>
  );
};

export default PublicLayout;
