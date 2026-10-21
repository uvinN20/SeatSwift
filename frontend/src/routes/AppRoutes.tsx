import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import PublicLayout from "../components/layout/PublicLayout";
const AdminLayout = lazy(() => import("../components/layout/AdminLayout"));
const HomePage = lazy(() => import("../pages/public/HomePage"));
const SearchResultsPage = lazy(() => import("../pages/public/SearchResultsPage"));
const RoutesPage = lazy(() => import("../pages/public/RoutesPage"));
const SchedulesPage = lazy(() => import("../pages/public/SchedulesPage"));
const AboutPage = lazy(() => import("../pages/public/AboutPage"));
const ContactPage = lazy(() => import("../pages/public/ContactPage"));
const BookingFlowPage = lazy(() => import("../pages/booking/BookingFlowPage"));
const PassengerBookings = lazy(() => import("../pages/passenger/PassengerBookings"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const AdminPayments = lazy(() => import("../pages/admin/AdminPayments"));
const AdminReservations = lazy(() => import("../pages/admin/AdminReservations"));
const AdminSchedules = lazy(() => import("../pages/admin/AdminSchedules"));
const AdminOwners = lazy(() => import("../pages/admin/AdminOwners"));
const OwnerDashboard = lazy(() => import("../pages/owner/OwnerDashboard"));
const OwnerRequestPage = lazy(() => import("../pages/auth/OwnerRequestPage"));
import ProtectedRoute from "./ProtectedRoute";
import EmptyState from "../components/common/EmptyState";
import { ROUTES } from "../types/routes";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="route-loading" role="status">Loading your journey…<span /></div>}><Routes>
        {/* Auth screens have their own full-page layout */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.PASSENGER_LOGIN} element={<LegacyLoginRedirect />} />
        <Route path={ROUTES.PASSENGER_REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<LegacyLoginRedirect />} />
        <Route path="/owner/login" element={<LegacyLoginRedirect />} />
        <Route path={ROUTES.OWNER_REQUEST} element={<OwnerRequestPage />} />
        <Route path={ROUTES.OWNER_DASHBOARD} element={<ProtectedRoute role="BUS_OWNER"><OwnerDashboard /></ProtectedRoute>} />

        {/* Customer site */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.SEARCH} element={<SearchResultsPage />} />
          <Route path={ROUTES.ROUTES_INFO} element={<RoutesPage />} />
          <Route path={ROUTES.SCHEDULES} element={<SchedulesPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />
          {/* Seat map is public; signing in is requested when the passenger continues */}
          <Route path={`${ROUTES.BOOK}/:scheduleId`} element={<BookingFlowPage />} />
          <Route
            path={ROUTES.PASSENGER_BOOKINGS}
            element={
              <ProtectedRoute role="PASSENGER">
                <PassengerBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="sb-container sb-section">
                <EmptyState title="Page not found" description="The page you are looking for does not exist." />
              </div>
            }
          />
        </Route>

        {/* Admin console */}
        <Route
          element={
            <ProtectedRoute role="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.ADMIN_PAYMENTS} element={<AdminPayments />} />
          <Route path={ROUTES.ADMIN_RESERVATIONS} element={<AdminReservations />} />
          <Route path={ROUTES.ADMIN_SCHEDULES} element={<AdminSchedules />} />
          <Route path={ROUTES.ADMIN_OWNERS} element={<AdminOwners />} />
        </Route>
      </Routes></Suspense>
    </BrowserRouter>
  );
};

const LegacyLoginRedirect = () => {
  const location = useLocation();
  return <Navigate to={ROUTES.LOGIN} replace state={location.state} />;
};

export default AppRoutes;
