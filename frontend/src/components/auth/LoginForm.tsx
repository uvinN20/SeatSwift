import { Alert, Button, Input } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  identityLabel: string;
  identityType?: "text" | "email";
  submitLabel?: string;
  footer?: ReactNode;
  /** Resolve to an error message string to display, or undefined on success. */
  onSubmit: (data: { username: string; password: string }) => Promise<string | undefined>;
}

const LoginForm = ({ title, subtitle, identityLabel, identityType = "text", submitLabel = "Sign in", footer, onSubmit }: Props) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(`${identityLabel} and password are required`);
      return;
    }
    setLoading(true);
    setError(null);
    const message = await onSubmit({ username: username.trim(), password });
    if (message) {
      setError(message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="sb-stack" aria-label={title}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="sb-muted" style={{ marginTop: 6 }}>{subtitle}</p>}
      </div>

      {error && <Alert type="error" showIcon title={error} role="alert" />}

      <div className="sb-field">
        <label htmlFor="login-id">{identityLabel}</label>
        <Input id="login-id" size="large" type={identityType} autoComplete="username" prefix={<UserOutlined />} value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>

      <div className="sb-field">
        <label htmlFor="login-pw">Password</label>
        <Input.Password id="login-pw" size="large" autoComplete="current-password" prefix={<LockOutlined />} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <Button type="primary" size="large" htmlType="submit" block loading={loading}>{submitLabel}</Button>
      {footer && <div className="sb-auth__links">{footer}</div>}
    </form>
  );
};

export default LoginForm;
