import ThemeToggle from "../ui/ThemeToggle";
import { useState } from "react";
import { Button, Drawer, Dropdown } from "antd";
import { CalendarOutlined, CreditCardOutlined, DashboardOutlined, LeftOutlined, MenuOutlined, ProfileOutlined, RightOutlined, UserOutlined } from "@ant-design/icons";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Brand from "../common/Brand";
import { clearSession, getAccountName } from "../../utils/auth";
import { ROUTES } from "../../types/routes";

const NAV = [
  { to: ROUTES.ADMIN_DASHBOARD, label: "Dashboard", icon: <DashboardOutlined />, title: "Dashboard" },
  { to: ROUTES.ADMIN_PAYMENTS, label: "Payments", icon: <CreditCardOutlined />, title: "Payment verification" },
  { to: ROUTES.ADMIN_RESERVATIONS, label: "Reservations", icon: <ProfileOutlined />, title: "Reservations" },
  { to: ROUTES.ADMIN_SCHEDULES, label: "Schedules", icon: <CalendarOutlined />, title: "Journey schedules" },
  { to: ROUTES.ADMIN_OWNERS, label: "Bus owners", icon: <UserOutlined />, title: "Bus owners & assignments" },
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = NAV.find((n) => pathname.startsWith(n.to))?.title ?? "Admin";

  const logout = () => {
    clearSession();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const links = (onClick?: () => void) =>
    NAV.map((n) => (
      <NavLink key={n.to} to={n.to} onClick={onClick} title={n.label}>
        <span className="sb-admin__ico" aria-hidden="true">{n.icon}</span>
        <span className="sb-admin__label">{n.label}</span>
      </NavLink>
    ));

  return (
    <div className="sb-admin">
      <aside className={`sb-admin__side ${collapsed ? "is-collapsed" : ""}`} aria-label="Admin navigation">
        <Brand light to={ROUTES.ADMIN_DASHBOARD} />
        <nav className="sb-admin__nav">{links()}</nav>
        <Button
          type="text"
          style={{ color: "#c3cbd9" }}
          icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((c) => !c)}
        >
          {!collapsed && "Collapse"}
        </Button>
      </aside>

      <div className="sb-admin__body">
        <header className="sb-admin__top">
          <div className="sb-row">
            <Button className="sb-admin__burger" icon={<MenuOutlined />} aria-label="Open navigation" onClick={() => setDrawer(true)} />
            <h1>{title}</h1>
          </div>
          <ThemeToggle/><Dropdown
            trigger={["click"]}
            menu={{
              items: [
                { key: "site", label: "View booking site", onClick: () => navigate(ROUTES.HOME) },
                { key: "out", label: "Log out", danger: true, onClick: logout },
              ],
            }}
          >
            <Button icon={<UserOutlined />}>{getAccountName() ?? "Admin"}</Button>
          </Dropdown>
        </header>

        <main className="sb-admin__main page-enter" key={pathname}>
          <Outlet />
        </main>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} placement="left" size={280} title="Admin">
        <nav className="sb-drawer-nav sb-admin__drawernav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setDrawer(false)}>{n.label}</NavLink>
          ))}
        </nav>
      </Drawer>
    </div>
  );
};

export default AdminLayout;
