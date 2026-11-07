import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import type { ReactNode } from "react";

export type AdminSectionProps = {
  /** The anchor the administration search links to (`ADMIN_SEARCH_INDEX`). */
  id?: string;
  title: string;
  description?: string;
  /** Buttons or a badge on the right of the title row. */
  action?: ReactNode;
  /** A table inside runs edge to edge (ADR 0086). */
  flush?: boolean;
  children?: ReactNode;
};

/**
 * One block of settings on an administration page (a form, a table, a connection): a flat card
 * with its title and description, so every page reads the same.
 */
export function AdminSection(props: AdminSectionProps) {
  const { id, title, description, action, flush, children } = props;
  return (
    <Card id={id} className="scroll-mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      {children ? (
        <CardContent className={flush ? "p-0" : undefined}>{children}</CardContent>
      ) : null}
    </Card>
  );
}
