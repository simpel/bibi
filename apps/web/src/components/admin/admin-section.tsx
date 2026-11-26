import { PageBand } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ADMIN_SECTIONS, type AdminSectionId } from "@/components/shell/admin-sections";

export type AdminBandProps = {
  /** The band's anchor (its `id`) and its already translated title. */
  anchor: string;
  title: string;
  description?: string | undefined;
  /** Buttons, a switch or a badge on the right of the title row. */
  actions?: ReactNode;
  children?: ReactNode;
};

/**
 * The band every administration section is made of. A page that is not in the sidebar (a room's
 * settings) builds its sections from it directly; sidebar pages use `AdminSection`.
 */
export function AdminBand({ anchor, title, description, actions, children }: AdminBandProps) {
  return (
    <PageBand
      id={anchor}
      aria-labelledby={`${anchor}-title`}
      className="scroll-mt-14"
      containerClassName="gap-6"
    >
      <header className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid min-w-0 gap-1">
          <h2 id={`${anchor}-title`} className="text-2xl">
            {title}
          </h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </PageBand>
  );
}

export type AdminSectionProps = {
  /** Which section this is: its anchor and title are the sidebar sub-link's, so they always match. */
  section: AdminSectionId;
  description?: string | undefined;
  /** Buttons, a switch or a badge on the right of the title row. */
  actions?: ReactNode;
  children?: ReactNode;
};

/**
 * One section of an administration page (ADR 0036, 0038): an edge-to-edge band, its content in
 * the page container, a title row with the section's actions on the right. Bands alternate
 * their background inside `AdminSections`. A section with nothing to show is left out by its
 * feature unless the caller may create something in it; the sidebar lists what is on the page.
 */
export function AdminSection({ section, ...rest }: AdminSectionProps) {
  const t = useTranslations("adminArea.search.entries");
  const { anchor } = ADMIN_SECTIONS[section];
  return <AdminBand anchor={anchor} title={t(`${section}.label`)} {...rest} />;
}
