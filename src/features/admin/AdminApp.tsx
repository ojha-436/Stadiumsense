import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FirebaseError } from "firebase/app";
import { Shield, UserPlus, Inbox } from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/api";
import { usePendingRequests, useStaffUsers } from "./hooks";
import { decideAccessRequest } from "./actions";

type NewRole = "vendor" | "ops" | "admin";

export default function AdminApp() {
  const { t } = useTranslation();
  const { data: users } = useStaffUsers();
  const { data: requests } = usePendingRequests();
  const nav: NavItem[] = [{ to: "/admin", label: t("nav.admin"), icon: Shield }];

  const roleLabel = (r: string) => (r === "vendor" ? t("role.vendor") : t("role.operator"));

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<NewRole>("vendor");
  const [stallId, setStallId] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const provision = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const res = await api.provisionUser({
        email,
        displayName: name,
        role,
        stallId: role === "vendor" ? stallId : undefined,
      });
      setCreated(res.tempPassword);
      setEmail("");
      setName("");
      setStallId("");
    } catch (err) {
      setError(err instanceof FirebaseError ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (uid: string, active: boolean) => {
    await api.setUserActive({ uid, active });
  };

  return (
    <AppShell nav={nav}>
      <h1 className="mb-4 text-2xl font-bold">{t("admin.title")}</h1>

      {/* Access requests from vendors & stadium operators awaiting approval */}
      <Card className="mb-4 border-accent/30">
        <CardHeader>
          <Inbox className="h-5 w-5 text-accent" aria-hidden="true" />
          <CardTitle>{t("admin.requests")}</CardTitle>
          {requests.length > 0 && (
            <Badge tone="warning" className="ml-auto">
              {requests.length}
            </Badge>
          )}
        </CardHeader>
        {requests.length === 0 ? (
          <p className="py-3 text-sm text-fg-muted">{t("admin.noRequests")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-surface-border">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{r.displayName}</p>
                  <p className="text-xs text-fg-muted">{r.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="info">{roleLabel(r.requestedRole)}</Badge>
                  <Button size="sm" onClick={() => void decideAccessRequest(r, true)}>
                    {t("admin.approve")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void decideAccessRequest(r, false)}>
                    {t("admin.reject")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <UserPlus className="h-5 w-5 text-flag-gold" aria-hidden="true" />
            <CardTitle>{t("admin.provision")}</CardTitle>
          </CardHeader>

          {created && (
            <Alert tone="success" className="mb-3">
              {t("admin.created", { pw: created })}
            </Alert>
          )}
          {error && (
            <Alert tone="error" className="mb-3">
              {error}
            </Alert>
          )}

          <form onSubmit={provision} className="flex flex-col gap-3">
            <Field label={t("admin.inviteName")} required>
              {(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} required />}
            </Field>
            <Field label={t("admin.inviteEmail")} required>
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              )}
            </Field>
            <Field label={t("admin.inviteRole")}>
              {(props) => (
                <Select {...props} value={role} onChange={(e) => setRole(e.target.value as NewRole)}>
                  <option value="vendor">{t("nav.vendor")}</option>
                  <option value="ops">{t("nav.ops")}</option>
                  <option value="admin">{t("nav.admin")}</option>
                </Select>
              )}
            </Field>
            {role === "vendor" && (
              <Field label={t("admin.assignStall")} required hint="stallId">
                {(props) => (
                  <Input {...props} value={stallId} onChange={(e) => setStallId(e.target.value)} required />
                )}
              </Field>
            )}
            <Button type="submit" loading={busy} disabled={!name || !email}>
              {busy ? t("admin.creating") : t("admin.create")}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.users")}</CardTitle>
          </CardHeader>
          <ul className="flex flex-col divide-y divide-surface-border">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{u.displayName}</p>
                  <p className="text-xs text-night-100">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{u.role}</Badge>
                  <Badge tone={u.active ? "success" : "danger"}>
                    {u.active ? "active" : "inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant={u.active ? "danger" : "secondary"}
                    onClick={() => void toggleActive(u.id, !u.active)}
                  >
                    {u.active ? t("admin.deactivate") : t("admin.activate")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
