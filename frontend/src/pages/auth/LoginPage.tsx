import { Link, useLocation, useNavigate } from "react-router-dom";
import { notification } from "antd";
import AuthShell from "../../components/auth/AuthShell";
import LoginForm from "../../components/auth/LoginForm";
import { sharedLogin } from "../../services/authService";
import { errorMessage } from "../../utils/format";
import { ROUTES } from "../../types/routes";

const LoginPage = () => {
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;

  const handle = async (data: { username: string; password: string }) => {
    try {
      const response = await sharedLogin(data);
      const { token, role } = response.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      notification.success({
        title: "Signed in",
        description: role === "ADMIN" ? "Welcome to the operations console." : role === "BUS_OWNER" ? "Welcome to your fleet dashboard." : "Welcome back to SeatSwift.",
      });
      const defaultPath = role === "ADMIN" ? ROUTES.ADMIN_DASHBOARD : role === "BUS_OWNER" ? ROUTES.OWNER_DASHBOARD : ROUTES.PASSENGER_BOOKINGS;
      const mayReturnTo = from && from.startsWith("/") && !from.startsWith("//") && (role === "ADMIN" ? from.startsWith("/admin/") : role === "BUS_OWNER" ? from.startsWith("/owner/") : !from.startsWith("/admin") && !from.startsWith("/owner"));
      navigate(mayReturnTo ? from : defaultPath, { replace: true });
      return undefined;
    } catch (err) {
      return await errorMessage(err, "We couldn't sign you in. Check your email or username and password.");
    }
  };

  return (
    <AuthShell heading="Your next journey starts here." blurb="One secure sign-in for passengers, bus owners and administrators. Your account opens the right dashboard.">
      <LoginForm
        title="Welcome back"
        subtitle="Sign in to continue to your SeatSwift account."
        identityLabel="Email or username"
        onSubmit={handle}
        footer={
          <>
            <span>New to SeatSwift? <Link to={ROUTES.PASSENGER_REGISTER} state={{ from }}>Create a passenger account</Link></span>
            <Link to={ROUTES.OWNER_REQUEST}>Bus owner? Request an owner account</Link>
            <Link to={ROUTES.HOME}>Back to home</Link>
          </>
        }
      />
      <p className="sb-login-hint">Passengers use their email. Bus owners and administrators use their username. Bus owners need administrator approval before signing in.</p>
    </AuthShell>
  );
};

export default LoginPage;
