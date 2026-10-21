import ThemeToggle from "../ui/ThemeToggle";
import { m } from "motion/react";
import { useState } from "react";
import { Button, Drawer, Dropdown } from "antd";
import { MenuOutlined, UserOutlined, DownOutlined } from "@ant-design/icons";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Brand from "../common/Brand";
import { useScrolled } from "../../hooks/useScrolled";
import { clearSession, getAccountName, getRole, isAuthenticated } from "../../utils/auth";
import { ROUTES } from "../../types/routes";

const NAV = [
  { to: ROUTES.HOME, label: "Home", end: true },
  { to: ROUTES.SEARCH, label: "Search Buses", end: false },
  { to: ROUTES.ROUTES_INFO, label: "Routes", end: false },
  { to: ROUTES.SCHEDULES, label: "Schedules", end: false },
  { to: ROUTES.PASSENGER_BOOKINGS, label: "My Bookings", end: false },
  { to: ROUTES.ABOUT, label: "About Us", end: false },
  { to: ROUTES.CONTACT, label: "Contact", end: false },
];

const SiteHeader = () => {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useLocation(); // re-render on navigation so the account state stays current

  const role = isAuthenticated() ? getRole() : null;
  const account = getAccountName();

  const logout = () => {
    clearSession();
    setOpen(false);
    navigate(ROUTES.HOME);
  };

  const links = (onClick?: () => void) =>
    NAV.map((n) => (
      <NavLink key={n.to} to={n.to} end={n.end} onClick={onClick}>
        {({ isActive }) => <><span className="nav-text">{n.label}</span>{isActive && <m.span className="nav-active" layoutId="navigation-pill" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}</>}
      </NavLink>
    ));

  return (
    <header className={`sb-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="sb-container sb-header__inner">
        <Brand />

        <nav className="sb-nav" aria-label="Main">
          {links()}
        </nav>

        <div className="sb-header__actions"><ThemeToggle/>
          {role === "PASSENGER" ? (
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  { key: "bookings", label: "My bookings", onClick: () => navigate(ROUTES.PASSENGER_BOOKINGS) },
                  { key: "logout", label: "Log out", danger: true, onClick: logout },
                ],
              }}
            >
              <Button icon={<UserOutlined />} aria-label="Account menu">
                <span className="sb-header__desktop-only">{account ?? "Account"}</span>
                <DownOutlined />
              </Button>
            </Dropdown>
          ) : role === "BUS_OWNER" ? (
            <Link to={ROUTES.OWNER_DASHBOARD}><Button type="primary">Owner dashboard</Button></Link>
          ) : role === "ADMIN" ? (
            <Link to={ROUTES.ADMIN_DASHBOARD}>
              <Button type="primary">Admin dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to={ROUTES.PASSENGER_REGISTER} className="sb-header__desktop-only">
                <Button>Register</Button>
              </Link>
              <Link to={ROUTES.LOGIN}>
                <Button type="primary">Sign in</Button>
              </Link>
            </>
          )}

          <Button
            className="sb-burger"
            icon={<MenuOutlined />}
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          />
        </div>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} placement="right" size={300} title="Menu">
        <nav className="sb-drawer-nav" aria-label="Mobile">
          {links(() => setOpen(false))}
          {role === null && (
            <NavLink to={ROUTES.PASSENGER_REGISTER} onClick={() => setOpen(false)}>
              Register
            </NavLink>
          )}
          {role !== null && (
            <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); }}>
              Log out
            </a>
          )}
        </nav>
      </Drawer>
    </header>
  );
};

export default SiteHeader;
