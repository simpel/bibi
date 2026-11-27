import { cn } from "@bibi/ui";
import type { ReactNode } from "react";

export type SiteFeatureBlockProps = {
  /** Anchor for the header links; the `h2` gets `${id}-title`. */
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  visual: ReactNode;
  /** Put the visual on the left from `lg`. */
  flip?: boolean;
};

/** One message: a label, the `h2` and one line on one side, a product window on the other. */
export function SiteFeatureBlock({
  id,
  eyebrow,
  title,
  body,
  visual,
  flip,
}: SiteFeatureBlockProps) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16"
    >
      <div className={cn("grid max-w-xl gap-4", flip && "lg:order-2")}>
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h2 id={titleId} className="text-balance text-4xl sm:text-5xl">
          {title}
        </h2>
        <p className="text-pretty text-lg text-muted-foreground">{body}</p>
      </div>
      <div className="rounded-2xl border bg-muted/50 p-4 sm:p-8">{visual}</div>
    </section>
  );
}
