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
 * A page's title row: title and description left, actions right of the title on a wide page. On
 * a narrow one (under 42rem of the page's own width) it stacks the same way everywhere: the
 * actions on their own row at the right, then the title across the whole width, then the
 * description. It follows the room the page has, not the screen, so a narrow page beside the
 * open sidebar behaves like a phone.
 */
export function PageHeader({ title, heading, suffix, description, actions }: PageHeaderProps) {
  return (
    <div className="@container">
      <header className="flex flex-col-reverse gap-3 @2xl:flex-row @2xl:items-end @2xl:justify-between @2xl:gap-4">
        <div className="grid min-w-0 gap-1 @2xl:flex-1">
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
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end @2xl:ml-auto">
            {actions}
          </div>
        ) : null}
      </header>
    </div>
  );
}
