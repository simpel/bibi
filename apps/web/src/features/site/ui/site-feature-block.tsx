import { cn } from "@bibi/ui";
import type { ReactNode } from "react";

export type SiteFeatureBlockProps = {
  id?: string;
  eyebrow: string;
  title: string;
  body: string;
  visual: ReactNode;
  /** Extra content under the body (a list, a note). */
  children?: ReactNode;
  /** Put the visual on the left from `lg`. */
  flip?: boolean;
};

/** One chapter: text on one side, a product window on a quiet panel on the other. */
export function SiteFeatureBlock({
  id,
  eyebrow,
  title,
  body,
  visual,
  children,
  flip,
}: SiteFeatureBlockProps) {
  return (
    <article id={id} className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn("grid gap-4", flip && "lg:order-2")}>
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h3 className="text-balance text-3xl sm:text-4xl">{title}</h3>
        <p className="max-w-xl text-pretty text-lg text-muted-foreground">{body}</p>
        {children}
      </div>
      <div className="rounded-2xl border bg-muted/50 p-4 sm:p-8">{visual}</div>
    </article>
  );
}
