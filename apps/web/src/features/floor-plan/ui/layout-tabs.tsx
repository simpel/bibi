import { Tabs, TabsList, TabsTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type MouseEvent, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Link, useRouter } from "@/lib/navigation";
import { layoutsRoute } from "../layouts-path";

/** One layout: its name, its setup's name when it differs, and its seats. */
export type LayoutTab = { key: string; label: string; hint: string | null; seats: number };

export type LayoutTabsProps = {
  itemId: string;
  tabs: readonly LayoutTab[];
  current: string;
  /** Unsaved changes: leaving the tab asks first. */
  dirty: boolean;
};

/** One tab per layout of the item; each tab is its own URL. */
export function LayoutTabs({ itemId, tabs, current, dirty }: LayoutTabsProps) {
  const t = useTranslations("floorPlan");
  const router = useRouter();
  const [leaving, setLeaving] = useState<string | null>(null);
  const guard = ({ event, href }: { event: MouseEvent; href: string }) => {
    if (!dirty) return;
    event.preventDefault();
    setLeaving(href);
  };
  return (
    <>
      <Tabs value={current} className="min-w-0">
        <TabsList aria-label={t("tabs")} className="max-w-full justify-start overflow-x-auto">
          {tabs.map((tab) => {
            const href = layoutsRoute({ itemId, layoutId: tab.key });
            return (
              <TabsTrigger key={tab.key} value={tab.key} asChild className="flex-none gap-1.5">
                <Link href={href} onClick={(event) => guard({ event, href })}>
                  {tab.label}
                  {tab.hint && tab.hint !== tab.label ? (
                    <span className="text-xs text-muted-foreground">{tab.hint}</span>
                  ) : null}
                  <span className="text-xs text-muted-foreground tabular-nums">{tab.seats}</span>
                </Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      <ConfirmDialog
        open={leaving !== null}
        onOpenChange={(open) => (open ? null : setLeaving(null))}
        title={t("leave.title")}
        description={t("leave.description")}
        confirmLabel={t("leave.confirm")}
        pending={false}
        onConfirm={() => {
          if (leaving) router.push(leaving);
          setLeaving(null);
        }}
      />
    </>
  );
}
