import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Checkbox, Input, Modal, Select, Switch, Table, Tag, notification } from "antd";
import { getFleetAssignments, getOwners, saveOwner, reviewOwner, type FleetBus, type OwnerAccount, type OwnerInput } from "../../services/ownerService";
import { errorMessage } from "../../utils/format";

const blank = (): OwnerInput => ({ username: "", fullName: "", phoneNumber: "", password: "", active: true, busIds: [] });
const AdminOwners = () => {
  const [owners, setOwners] = useState<OwnerAccount[]>([]);
  const [fleet, setFleet] = useState<FleetBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number>();
  const [form, setForm] = useState<OwnerInput>(blank);
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState<OwnerAccount>();
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reason, setReason] = useState("");
  const [reviewError, setReviewError] = useState<string>();
  const [reviewSaving, setReviewSaving] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accounts, buses] = await Promise.all([getOwners(), getFleetAssignments()]);
      setOwners(accounts.data.data); setFleet(buses.data.data); setError(undefined);
    } catch (e) { setError(await errorMessage(e, "Could not load owner accounts")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const edit = (owner?: OwnerAccount) => {
    setEditing(owner?.ownerId); setForm(owner ? { ...owner, password: "" } : blank()); setFormError(undefined); setOpen(true);
  };
  const save = async () => {
    setSaving(true); setFormError(undefined);
    try {
      await saveOwner(editing, form);
      notification.success({ title: editing ? "Owner account updated" : "Owner account created", description: editing ? "Owner access requires both admin approval and an enabled account." : "Approval is pending. Choose Approve access to authorize this owner." });
      setOpen(false); await load();
    } catch (e) { setFormError(await errorMessage(e, "Could not save this owner account")); }
    finally { setSaving(false); }
  };
  const beginReview = (owner: OwnerAccount, next: "APPROVED" | "REJECTED") => {
    setReviewing(owner); setDecision(next); setReason(""); setIdentityVerified(false); setReviewError(undefined);
  };
  const submitReview = async () => {
    if (!reviewing) return;
    if (!reason.trim()) { setReviewError("Record what you verified, or a rejection reason."); return; }
    if (decision === "APPROVED" && !identityVerified) { setReviewError("Verify the owner's identity and bus ownership, then tick the confirmation."); return; }
    setReviewSaving(true); setReviewError(undefined);
    try {
      await reviewOwner(reviewing.ownerId,decision,reason,identityVerified);
      notification.success({ title: decision === "APPROVED" ? "Owner access approved" : "Owner approval rejected or revoked" });
      setReviewing(undefined); await load();
    } catch (e) { setReviewError(await errorMessage(e,"Could not update owner approval")); }
    finally { setReviewSaving(false); }
  };
  return <div className="sb-stack">
    <div className="sb-toolbar" style={{ justifyContent: "space-between" }}>
      <p className="sb-muted">Create accounts, assign buses and approve owner access. {owners.filter(o => o.approvalStatus === "PENDING").length} awaiting approval.</p>
      <Button type="primary" onClick={() => edit()}>New owner</Button>
    </div>
    {error && <Alert type="error" title={error} action={<Button onClick={() => void load()}>Retry</Button>} />}
    <Table<OwnerAccount> rowKey="ownerId" loading={loading} dataSource={owners} scroll={{ x: 750 }} pagination={{ pageSize: 10 }} columns={[
      { title: "Owner", render: (_, o) => <><strong>{o.fullName}</strong><div className="sb-muted">{o.username}</div></> },
      { title: "Phone", dataIndex: "phoneNumber" },
      { title: "Assigned buses", render: (_, o) => o.busIds.length ? o.busIds.map(id => <Tag key={id}>Bus #{id}</Tag>) : "No buses assigned" },
      { title: "Approval", render: (_, o) => <><Tag color={o.approvalStatus === "APPROVED" ? "green" : o.approvalStatus === "PENDING" ? "gold" : "red"}>{o.approvalStatus}</Tag>{o.reviewNote && <div className="sb-muted">{o.reviewNote}</div>}{o.reviewedBy && <small className="sb-muted">Reviewed by admin #{o.reviewedBy}</small>}</> },
      { title: "Account", render: (_, o) => <Tag color={o.active ? "green" : "default"}>{o.active ? "Enabled" : "Disabled"}</Tag> },
      { title: "Actions", render: (_, o) => <div className="sb-row" style={{ flexWrap: "wrap" }}><Button onClick={() => edit(o)}>Manage</Button>{o.approvalStatus !== "APPROVED" && <Button type="primary" onClick={() => beginReview(o,"APPROVED")}>Approve access</Button>}{o.approvalStatus !== "REJECTED" && <Button danger onClick={() => beginReview(o,"REJECTED")}>{o.approvalStatus === "APPROVED" ? "Revoke approval" : "Reject"}</Button>}</div> },
    ]} />
    <Alert type="info" showIcon title="One-time owner verification" description="Verify the owner's original identity and bus ownership documents before approving access. Approval is saved for future sign-ins. Revoking approval or disabling the account stops existing tokens on their next request." />
    <Modal title={editing ? "Manage bus owner" : "Create bus owner"} open={open} onCancel={() => { if (!saving) setOpen(false); }} onOk={() => void save()} okText="Save owner" confirmLoading={saving} maskClosable={!saving} closable={!saving}>
      <div className="sb-stack">
        {formError && <Alert type="error" title={formError} />}
        <div className="sb-field"><label htmlFor="owner-name">Full name</label><Input id="owner-name" value={form.fullName} maxLength={150} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
        <div className="sb-field"><label htmlFor="owner-username">Username</label><Input id="owner-username" autoComplete="off" value={form.username} disabled={!!editing} maxLength={60} onChange={e => setForm({ ...form, username: e.target.value })} /><small className="sb-muted">3–60 letters, numbers, dots, underscores or hyphens.</small></div>
        <div className="sb-field"><label htmlFor="owner-phone">Phone number</label><Input id="owner-phone" type="tel" value={form.phoneNumber} maxLength={40} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} /></div>
        <div className="sb-field"><label htmlFor="owner-password">{editing ? "Reset password (optional)" : "Initial password"}</label><Input.Password id="owner-password" autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><small className="sb-muted">At least 8 characters. {editing && "Leave empty to keep the current password."}</small></div>
        <div className="sb-field"><label htmlFor="owner-buses">Assigned buses</label><Select id="owner-buses" mode="multiple" showSearch optionFilterProp="label" style={{ width: "100%" }} value={form.busIds} onChange={busIds => setForm({ ...form, busIds })} options={fleet.filter(b => b.ownerId === null || b.ownerId === editing).map(b => ({ value: b.busId, label: `#${b.busId} · ${b.source} → ${b.destination} · ${b.totalSeats} seats` }))} placeholder="Choose buses" /><small className="sb-muted">To transfer a bus, remove it from its current owner first.</small></div>
        <div className="sb-row"><Switch id="owner-active" checked={form.active} onChange={active => setForm({ ...form, active })} /><label htmlFor="owner-active">Account enabled (admin approval also required)</label></div>
      </div>
    </Modal>
    <Modal open={!!reviewing} title={decision === "APPROVED" ? "Approve owner access" : "Reject or revoke owner access"} okText={decision === "APPROVED" ? "Approve access" : "Confirm rejection / revocation"} okButtonProps={{ danger: decision === "REJECTED" }} confirmLoading={reviewSaving} closable={!reviewSaving} maskClosable={!reviewSaving} onCancel={() => { if (!reviewSaving) setReviewing(undefined); }} onOk={() => void submitReview()}>
      <div className="sb-stack">
        <p><strong>{reviewing?.fullName}</strong> · {reviewing?.username}</p>
        <p>{reviewing?.phoneNumber}</p>
        {reviewing?.verificationDetails && <div><strong>Submitted verification details</strong><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{reviewing.verificationDetails}</p></div>}
        <p>{decision === "APPROVED" ? "Check this person's original identity and bus ownership documents. Approval authorizes the account once; the owner can then sign in normally." : "This owner will lose dashboard access. Existing tokens will stop working on their next request."}</p>
        {decision === "APPROVED" && <Checkbox checked={identityVerified} onChange={e => setIdentityVerified(e.target.checked)}>I have verified this owner's identity and bus ownership against original documents.</Checkbox>}
        {reviewing && !reviewing.active && <Alert type="warning" title="This account is disabled. Enable it under Manage before the owner can sign in." />}
        {reviewError && <Alert type="error" title={reviewError} />}
        <div className="sb-field"><label htmlFor="owner-review-note">{decision === "APPROVED" ? "Verification note (required)" : "Reason (required)"}</label><Input.TextArea id="owner-review-note" maxLength={500} rows={3} value={reason} onChange={e => setReason(e.target.value)} /></div>
      </div>
    </Modal>
  </div>;
};
export default AdminOwners;
