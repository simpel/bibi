import { PageContainer, PageSection } from "@bibi/ui";
import type { ReactNode } from "react";

export type AdminSectionProps = {
  /** The anchor the sidebar and the search link to (`ADMIN_SECTIONS`). */
  id: string;
  title: string;
  description?: string | undefined;
  /** Buttons, a switch or a badge on the right of the title row. */
  actions?: ReactNode;
  children?: ReactNode;
};

/**
 * One section of an administration page (ADR 0036, 0038): an edge-to-edge band, its content in
 * the page container, a title row with the section's actions on the right. Bands alternate
 * their background inside `AdminSections`.
 */
export function AdminSection({ id, title, description, actions, children }: AdminSectionProps) {
  return (
    <PageSection id={id} aria-labelledby={`${id}-title`} className="scroll-mt-14">
      <PageContainer className="grid gap-6 py-8 sm:py-10">
        <header className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid min-w-0 gap-1">
            <h2 id={`${id}-title`} className="text-2xl">
              {title}
            </h2>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
        {children}
      </PageContainer>
    </PageSection>
  );
}
