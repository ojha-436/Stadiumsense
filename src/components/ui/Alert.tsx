import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "error";

const TONE: Record<Tone, { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: "border-flag-blue/40 bg-flag-blue/10 text-flag-blue" },
  success: { icon: CheckCircle2, cls: "border-pitch-500/40 bg-pitch-500/10 text-pitch-400" },
  warning: { icon: AlertTriangle, cls: "border-flag-gold/40 bg-flag-gold/10 text-flag-gold" },
  error: { icon: XCircle, cls: "border-flag-red/40 bg-flag-red/10 text-flag-red" },
};

/** Inline status message. Errors use role=alert so they're announced at once. */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, cls } = TONE[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border p-3 text-sm", cls, className)}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-night-50/90">{children}</div>}
      </div>
    </div>
  );
}
