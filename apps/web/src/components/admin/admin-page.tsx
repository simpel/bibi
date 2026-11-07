import type { ReactNode } from "react";

export type AdminPageProps = { header: ReactNode; children?: ReactNode };

/** The body of every administration page: the header, then its sections, the same gap apart. */
export function AdminPage({ header, children }: AdminPageProps) {
  return (
    <div className="grid gap-6">
      {header}
      {children}
    </div>
  );
}
