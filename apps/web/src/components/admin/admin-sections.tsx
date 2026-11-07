import type { ReactNode } from "react";

export type AdminSectionsProps = {
  /** The page's name, the one heading above its sections (for screen readers; the sidebar shows it). */
  title: string;
  children: ReactNode;
};

/** An administration page: its sections one after another, every other band on a muted background. */
export function AdminSections({ title, children }: AdminSectionsProps) {
  return (
    <div className="[&>section:nth-of-type(even)]:bg-muted/50 [&>section+section]:border-t">
      <h1 className="sr-only">{title}</h1>
      {children}
    </div>
  );
}
