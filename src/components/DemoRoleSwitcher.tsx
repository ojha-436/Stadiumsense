import { useSyncExternalStore } from "react";
import { FlaskConical } from "lucide-react";
import type { Role } from "@/types/domain";
import { demoAuth } from "@/lib/demo/auth";
import { Select } from "@/components/ui/Field";

const ROLES: Role[] = ["fan", "vendor", "ops"];
const LABEL: Record<Role, string> = {
  fan: "Fan",
  vendor: "Vendor",
  ops: "Operator",
  admin: "Admin",
};

/** Demo-only shortcut to preview each role surface (bypasses approval). The
 *  admin portal is reached separately via its access-key gate at /admin. */
export function DemoRoleSwitcher(): JSX.Element {
  useSyncExternalStore(demoAuth.subscribe, demoAuth.getSnapshot);
  const role = demoAuth.role();
  return (
    <div className="flex items-center gap-1.5" title="Demo: preview role">
      <FlaskConical className="h-4 w-4 text-flag-gold" aria-hidden="true" />
      <label htmlFor="demo-role" className="sr-only">
        Preview role (demo)
      </label>
      <Select
        id="demo-role"
        value={role === "admin" ? "ops" : role}
        onChange={(e) => demoAuth.viewAs(e.target.value as Role)}
        className="h-9 w-auto py-0"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {LABEL[r]}
          </option>
        ))}
      </Select>
    </div>
  );
}
