import { AppLink } from "../app-link/app-link";

export type DaySnapshotLabelProps = { label: string; href?: string | undefined };

const LABEL = "truncate pt-1 text-muted-foreground";

/** A row's resource name, linking to its page when it has one; the full name is a tooltip. */
export function DaySnapshotLabel({ label, href }: DaySnapshotLabelProps) {
  if (!href) {
    return (
      <span className={LABEL} title={label}>
        {label}
      </span>
    );
  }
  return (
    <AppLink
      href={href}
      title={label}
      className={`${LABEL} underline-offset-2 hover:text-foreground hover:underline`}
    >
      {label}
    </AppLink>
  );
}
