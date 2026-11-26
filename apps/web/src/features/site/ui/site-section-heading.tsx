import { cn } from "@bibi/ui";

export type SiteSectionHeadingProps = {
  /** Id of the `h2`, for the section's `aria-labelledby`. */
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  className?: string;
};

/** The opening of every section: a small label, the `h2` and an optional lead. */
export function SiteSectionHeading({
  id,
  eyebrow,
  title,
  lead,
  className,
}: SiteSectionHeadingProps) {
  return (
    <div className={cn("grid max-w-3xl gap-4", className)}>
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 id={id} className="text-balance text-4xl sm:text-5xl">
        {title}
      </h2>
      {lead ? <p className="text-pretty text-lg text-muted-foreground">{lead}</p> : null}
    </div>
  );
}
