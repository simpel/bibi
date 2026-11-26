import type { ReactNode } from "react";

export type MockupFieldProps = { label: string; children: ReactNode };

/** A labelled row in a mock form; static, it takes no input. */
export function MockupField({ label, children }: MockupFieldProps) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
