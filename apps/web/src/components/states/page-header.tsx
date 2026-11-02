import type { ReactNode } from "react";

export type PageHeaderProps = {
  title: string;
  /** Dimmed sans text after the title, e.g. a reference number. */
  suffix?: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, suffix, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="grid gap-1">
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
