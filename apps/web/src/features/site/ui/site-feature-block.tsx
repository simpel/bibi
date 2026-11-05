import { cn } from "@bibi/ui";
import type { ReactNode } from "react";

export type SiteFeatureBlockProps = {
  eyebrow: string;
  title: string;
  body: string;
  visual: ReactNode;
  /** Put the visual on the left from `lg`. */
  flip?: boolean;
};

/** One feature: text on one side, a product window on the other, alternating down the page. */
export function SiteFeatureBlock({ eyebrow, title, body, visual, flip }: SiteFeatureBlockProps) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn("grid gap-4", flip && "lg:order-2")}>
        <p className="text-sm text-primary">{eyebrow}</p>
        <h3 className="text-balance text-3xl sm:text-4xl">{title}</h3>
        <p className="max-w-xl text-pretty text-lg text-muted-foreground">{body}</p>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent to-chart-3/15 p-6 sm:p-10">
        {visual}
      </div>
    </div>
  );
}
