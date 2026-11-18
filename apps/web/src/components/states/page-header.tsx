import type { ReactNode } from "react";

export type PageHeaderProps = {
  title: string;
  /** Replaces the whole `h1`, e.g. an `EditableTitle`; `title` and `suffix` are then ignored. */
  heading?: ReactNode;
  /** Dimmed sans text after the title, e.g. a reference number. */
  suffix?: string;
  description?: string;
  actions?: ReactNode;
};

/**
 * A page's title row: title and description left, actions right of the title while both fit, and
 * on a row above the title when the title needs the width (wrapped in reverse, so the title keeps
 * its place). It follows the room the page has, not the screen, so a narrow page beside the open
 * sidebar behaves like a phone.
 */
export function PageHeader({ title, heading, suffix, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap-reverse items-end justify-between gap-x-4 gap-y-3">
      <div className="grid min-w-0 flex-1 basis-80 gap-1">
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
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
