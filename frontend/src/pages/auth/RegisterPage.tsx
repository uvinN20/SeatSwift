import { useState } from "react";
import { Alert, Button, Input } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { passengerLogin } from "../../services/authService";
import AuthShell from "../../components/auth/AuthShell";
import { registerPassenger } from "../../services/bookingService";
import { errorMessage } from "../../utils/format";
import { ROUTES } from "../../types/routes";

type Fields = "name" | "email" | "phone" | "password" | "confirm";

const RegisterPage = () => {
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [v, setV] = useState<Record<Fields, string>>({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (k: Fields) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (v.name.trim().length < 2) next.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(v.email)) next.email = "Enter a valid email address";
    if (!/^(\+94|0)?\d{9,10}$/.test(v.phone.replace(/[\s-]/g, ""))) next.phone = "Enter a valid phone number, e.g. 0771234567";
    if (v.password.length < 8) next.password = "Use at least 8 characters";
    if (v.confirm !== v.password) next.confirm = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setFormError(null);
    try {
      await registerPassenger({ passengerName: v.name.trim(), email: v.email.trim(), phoneNumber: v.phone.replace(/[\s-]/g, ""), password: v.password });
      // sign the new passenger straight in so an interrupted booking can continue
      try {
        const res = await passengerLogin({ username: v.email.trim(), password: v.password });
        localStorage.setItem("token", res.data.data);
        localStorage.setItem("role", "PASSENGER");
        navigate(from ?? ROUTES.PASSENGER_BOOKINGS, { replace: true });
      } catch {
        navigate(ROUTES.LOGIN, { replace: true, state: { from } });
      }
    } catch (err) {
      setFormError(`${await errorMessage(err, "Registration failed")}. This email may already be registered.`);
      setLoading(false);
    }
  };

  const field = (k: Fields, label: string, props: React.ComponentProps<typeof Input> = {}, password = false) => (
    <div className="sb-field">
      <label htmlFor={`reg-${k}`}>{label}</label>
      {password ? (
        <Input.Password id={`reg-${k}`} size="large" value={v[k]} onChange={set(k)} status={errors[k] ? "error" : undefined} {...(props as object)} />
      ) : (
        <Input id={`reg-${k}`} size="large" value={v[k]} onChange={set(k)} status={errors[k] ? "error" : undefined} {...props} />
      )}
      {errors[k] && <span className="sb-field__error" role="alert">{errors[k]}</span>}
    </div>
  );

  return (
    <AuthShell heading="Create your account." blurb="One account for every trip - reserve seats and track payments.">
      <form onSubmit={(e) => void submit(e)} noValidate className="sb-stack" aria-label="Create account">
        <div>
          <h1>Create account</h1>
          <p className="sb-muted" style={{ marginTop: 6 }}>It only takes a minute.</p>
        </div>
        {formError && <Alert type="error" showIcon title={formError} role="alert" />}
        {field("name", "Full name", { autoComplete: "name" })}
        {field("email", "Email", { type: "email", autoComplete: "email" })}
        {field("phone", "Phone number", { inputMode: "tel", autoComplete: "tel" })}
        {field("password", "Password", { autoComplete: "new-password" }, true)}
        {field("confirm", "Confirm password", { autoComplete: "new-password" }, true)}
        <Button type="primary" size="large" htmlType="submit" block loading={loading}>Create account</Button>
        <div className="sb-auth__links">
          <span>Already registered? <Link to={ROUTES.LOGIN} state={{ from }}>Sign in</Link></span>
          <Link to={ROUTES.HOME}>Back to home</Link>
        </div>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
