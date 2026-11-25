import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type DangerZoneProps = ComponentProps<"section"> & {
  /** "Danger area": the same words on every page. */
  title: string;
};

/**
 * The one place a record is archived or deleted: last on its page (or its last tab), always
 * looking the same. A red hairline box of `DangerZoneRow`s, one per action.
 */
export function DangerZone({ title, className, children, ...props }: DangerZoneProps) {
  return (
    <section data-slot="danger-zone" className={cn("grid gap-3", className)} {...props}>
      <h2 className="text-xl text-destructive">{title}</h2>
      <div className="divide-y divide-destructive/20 rounded-lg border border-destructive/40">
        {children}
      </div>
    </section>
  );
}

export type DangerZoneRowProps = Omit<ComponentProps<"div">, "title"> & {
  title: string;
  /** What happens, in one or two short sentences. */
  description: ReactNode;
  /** The button that opens its confirm dialog. */
  action: ReactNode;
};

/** One action in the danger area: what it does on the left, its button on the right. */
export function DangerZoneRow({
  title,
  description,
  action,
  className,
  ...props
}: DangerZoneRowProps) {
  return (
    <div
      data-slot="danger-zone-row"
      className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4", className)}
      {...props}
    >
      <div className="grid min-w-0 flex-1 basis-64 gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
