import type { ReactNode } from "react";

export type PageHeaderProps = {
  title: string;
  /** Dimmed sans text after the title, e.g. a reference number. */
  suffix?: string;
  description?: string;
  actions?: ReactNode;
};

/**
 * A page's title row: title and description left, actions right of the title from `md` up and
 * under the description below it (the title-row rule in `packages/ui/CLAUDE.md`, like
 * `CardHeader`). A long description never pushes the actions onto their own row.
 */
export function PageHeader({ title, suffix, description, actions }: PageHeaderProps) {
  return (
    <header className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="grid min-w-0 gap-1">
        <h1 className="text-3xl">
          {title}
          {suffix ? (
            <span className="ml-3 font-sans text-xl font-normal text-muted-foreground tabular-nums">
              {suffix}
            </span>
          ) : null}
        </h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
