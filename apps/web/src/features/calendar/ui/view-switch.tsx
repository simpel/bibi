"use client";

import { cn } from "@bibi/ui";
import { saveUserPreference } from "@/features/user-preference/actions";
import { Link } from "@/lib/navigation";
import { CALENDAR_VIEW_PREFERENCE } from "../calendar-params";
import type { CalendarView } from "../calendar-period";

type ViewLink = {
  view: CalendarView;
  label: string;
  href: { pathname: string; query: Record<string, string> };
};

export type ViewSwitchProps = { label: string; current: CalendarView; links: ViewLink[] };

/**
 * Day, week, month or list, as links to each view's period. Picking one also remembers it as the
 * view bare `/calendar` opens in (ADR 0039). That save is a convenience on a navigation, not an
 * edit, so it runs in the background without a toast and a failure keeps the old preference.
 */
export function ViewSwitch({ label, current, links }: ViewSwitchProps) {
  const remember = ({ view }: { view: CalendarView }) => {
    void saveUserPreference({ key: CALENDAR_VIEW_PREFERENCE, value: view }).catch(() => undefined);
  };
  return (
    <nav aria-label={label} className="flex rounded-md border p-0.5">
      {links.map(({ view, label: name, href }) => (
        <Link
          key={view}
          href={href}
          onClick={() => remember({ view })}
          aria-current={view === current ? "page" : undefined}
          className={cn(
            "rounded-sm px-3 py-1 text-sm",
            view === current ? "bg-muted font-medium" : "text-muted-foreground",
          )}
        >
          {name}
        </Link>
      ))}
    </nav>
  );
}
