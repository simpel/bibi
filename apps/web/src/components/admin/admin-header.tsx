import type { ReactNode } from "react";
import { PageHeader } from "@/components/states/page-header";

export type AdminHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  /**
   * The page is one tab of an administration page: the layout above already shows the page's
   * title and tabs, so this row holds only the tab's description and actions.
   */
  inTab?: boolean;
};

/**
 * The header of every administration page or tab (ADR 0036): one title row with the actions on
 * its right. Inside a tab the title is for screen readers only, so the page has one visible h1.
 */
export function AdminHeader({ title, description, actions, inTab = false }: AdminHeaderProps) {
  if (!inTab) return <PageHeader title={title} description={description} actions={actions} />;
  return (
    <header className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="grid min-w-0 gap-1">
        <h2 className="sr-only">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
