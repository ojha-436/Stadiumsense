import { useId } from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /** Render prop receives the id/aria attributes to spread on the control. */
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
    "aria-required"?: boolean;
  }) => React.ReactNode;
}

/** Wraps a form control with a programmatically-associated label, hint, and
 *  error message so assistive tech announces them correctly (WCAG 1.3.1, 3.3.1). */
export function Field({ label, hint, error, required, className, children }: FieldProps): JSX.Element {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-night-100">
        {label}
        {required && (
          <span className="ml-0.5 text-flag-red" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-night-100/70">
          {hint}
        </p>
      )}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
      })}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-flag-red">
          {error}
        </p>
      )}
    </div>
  );
}

const controlClass =
  "h-11 w-full rounded-xl border border-surface-border bg-night-950 px-3 text-night-50 placeholder:text-night-100/40 focus:border-flag-gold";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>): JSX.Element {
  return <select className={cn(controlClass, "appearance-none", className)} {...props} />;
}
