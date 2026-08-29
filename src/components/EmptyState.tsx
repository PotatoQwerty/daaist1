import { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** The action that fills the screen, when there is one. */
  action?: ReactNode;
}

/**
 * An empty screen is an invitation to act, so the description says what
 * to do next rather than only stating that nothing is here.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center border border-dashed border-border px-6 py-16 text-center">
      <Icon
        className="size-7 text-muted-foreground"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 max-w-[42ch] text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
