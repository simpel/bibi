import { Tabs, TabsList, TabsTrigger } from "@bibi/ui";
import { Link } from "@/lib/navigation";

export type PageTab = { id: string; label: string };

export type PageTabNavProps = {
  /** The page's address; each tab is `?tab=<id>` on it. */
  base: string;
  tabs: readonly PageTab[];
  current: string;
  /** The tab list's accessible name. */
  label: string;
};

/**
 * A detail page's tabs as links along the bottom of its header (item, booking template): only the
 * open tab's sections load (ADR 0097).
 */
export function PageTabNav({ base, tabs, current, label }: PageTabNavProps) {
  return (
    <Tabs value={current} className="min-w-0">
      <TabsList
        variant="line"
        aria-label={label}
        className="max-w-full justify-start overflow-x-auto"
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} variant="line" asChild className="flex-none">
            <Link href={`${base}?tab=${tab.id}`} scroll={false}>
              {tab.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
