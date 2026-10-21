import { useState } from "react";
import { Alert, Button, Input } from "antd";
import { Link } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell";
import { requestOwnerAccount } from "../../services/ownerService";
import { errorMessage } from "../../utils/format";
import { ROUTES } from "../../types/routes";

const OwnerRequestPage = () => {
  const [form,setForm]=useState({ username:"",fullName:"",phoneNumber:"",password:"",verificationDetails:"" });
  const [confirm,setConfirm]=useState("");
  const [saving,setSaving]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [error,setError]=useState<string>();
  const submit=async (e: React.FormEvent) => {
    e.preventDefault(); setError(undefined);
    if (form.password !== confirm) { setError("Passwords do not match."); return; }
    setSaving(true);
    try {
      await requestOwnerAccount(form);
      setSubmitted(true); setForm({ username:"",fullName:"",phoneNumber:"",password:"",verificationDetails:"" }); setConfirm("");
    } catch (e) { setError(await errorMessage(e,"Could not submit your owner account request")); }
    finally { setSaving(false); }
  };
  return <AuthShell heading="Bring your fleet to SeatSwift." blurb="Request an owner account. An administrator verifies your identity and bus ownership before granting access.">
    {submitted ? <div className="sb-stack"><h1>Awaiting admin approval</h1><Alert type="success" showIcon title="Your request has been received" description="Contact the administrator to arrange verification of your original identity and bus ownership documents. Once approved, use your username and password on the shared sign-in page. This approval is required only once." /><Link to={ROUTES.LOGIN}><Button type="primary" block>Back to sign in</Button></Link></div> :
      <form onSubmit={e => void submit(e)} className="sb-stack" aria-label="Request bus owner account">
        <div><h1>Request an owner account</h1><p className="sb-muted" style={{ marginTop:8 }}>Access starts after one-time admin verification and approval.</p></div>
        {error && <Alert type="error" showIcon title={error} role="alert" />}
        <div className="sb-field"><label htmlFor="apply-owner-name">Full name</label><Input id="apply-owner-name" required maxLength={150} autoComplete="name" value={form.fullName} onChange={e => setForm({ ...form,fullName:e.target.value })} /></div>
        <div className="sb-field"><label htmlFor="apply-owner-phone">Phone number</label><Input id="apply-owner-phone" required type="tel" maxLength={40} autoComplete="tel" value={form.phoneNumber} onChange={e => setForm({ ...form,phoneNumber:e.target.value })} /></div>
        <div className="sb-field"><label htmlFor="apply-owner-username">Username</label><Input id="apply-owner-username" required minLength={3} maxLength={60} pattern="[A-Za-z0-9._-]{3,60}" autoComplete="username" value={form.username} onChange={e => setForm({ ...form,username:e.target.value })} /><small className="sb-muted">Letters, numbers, dots, underscores or hyphens.</small></div>
        <div className="sb-field"><label htmlFor="apply-owner-password">Password</label><Input.Password id="apply-owner-password" required minLength={8} autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form,password:e.target.value })} /></div>
        <div className="sb-field"><label htmlFor="apply-owner-confirm">Confirm password</label><Input.Password id="apply-owner-confirm" required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
        <div className="sb-field"><label htmlFor="apply-owner-verification">Business and bus ownership details</label><Input.TextArea id="apply-owner-verification" required maxLength={1000} rows={4} value={form.verificationDetails} onChange={e => setForm({ ...form,verificationDetails:e.target.value })} /><small className="sb-muted">Provide your operator/business name, bus registration numbers and ownership reference. The administrator will check these against your original documents.</small></div>
        <Button type="primary" htmlType="submit" loading={saving} size="large" block>Submit for admin approval</Button>
        <p className="sb-muted">Submitting a request does not grant owner access. The administrator will confirm ownership and assign your buses.</p>
        <div className="sb-auth__links"><Link to={ROUTES.LOGIN}>Back to sign in</Link><Link to={ROUTES.HOME}>Back to home</Link></div>
      </form>}
  </AuthShell>;
};
export default OwnerRequestPage;
