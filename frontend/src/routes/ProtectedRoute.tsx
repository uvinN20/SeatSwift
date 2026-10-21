import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { getRole, isAuthenticated, type Role } from "../utils/auth";
import { ROUTES } from "../types/routes";

interface Props {
  children: ReactNode;
  role: Role;
}

const ProtectedRoute = ({ children, role }: Props) => {
  const location = useLocation();
  const loginPath = ROUTES.LOGIN;

  if (!isAuthenticated() || getRole() !== role) {
    // remember where the visitor was going so sign-in can return them there
    return <Navigate to={loginPath} replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
