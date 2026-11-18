import { PageBands } from "@bibi/ui";
import type { ReactNode } from "react";

export type AdminSectionsProps = {
  /** The page's name, the one heading above its sections (for screen readers; the sidebar shows it). */
  title: string;
  children: ReactNode;
};

/** An administration page: its sections one after another as alternating bands. */
export function AdminSections({ title, children }: AdminSectionsProps) {
  return (
    <PageBands>
      <h1 className="sr-only">{title}</h1>
      {children}
    </PageBands>
  );
}
