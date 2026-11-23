import { cn } from "@bibi/ui";
import type { ReactNode } from "react";

export type PageHeaderProps = {
  title: string;
  /** Replaces the whole `h1`, e.g. an `EditableTitle`; `title` and `suffix` are then ignored. */
  heading?: ReactNode;
  /** Before the title, e.g. a record's picture: beside it when wide, on a row above when narrow. */
  leading?: ReactNode;
  /** Dimmed sans text after the title, e.g. a reference number. */
  suffix?: string;
  description?: string;
  actions?: ReactNode;
};

/**
 * A page's title row: title and description left, actions right, always on one row; a narrow
 * page folds its actions into one menu first (`HeaderActions foldBy="header"`). A `leading`
 * element (a record's picture) sits left of the title on a wide page and on its own row above
 * the title on a narrow one (under 42rem of the page's own width, so a page beside the open
 * sidebar behaves like a phone).
 */
export function PageHeader({
  title,
  heading,
  leading,
  suffix,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="@container/header">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 @2xl/header:grid-cols-[auto_minmax(0,1fr)_auto]">
        {leading ? <div className="col-span-2 @2xl/header:col-span-1">{leading}</div> : null}
        <div className={cn("grid min-w-0 gap-1", leading ? null : "@2xl/header:col-span-2")}>
          {heading ?? (
            <h1 className="text-3xl">
              {title}
              {suffix ? (
                <span className="ml-3 font-sans text-xl font-normal text-muted-foreground tabular-nums">
                  {suffix}
                </span>
              ) : null}
            </h1>
          )}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-start">
            {actions}
          </div>
        ) : null}
      </header>
    </div>
  );
}
