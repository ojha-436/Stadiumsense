import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/** Loading indicator that announces itself to assistive tech via role=status. */
export function Spinner({ label, className }: { label: string; className?: string }) {
  return (
    <div role="status" className={cn("flex items-center gap-2 text-night-100", className)}>
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
