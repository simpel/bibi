"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { NeedsYou } from "@/features/my-work/ui/needs-you";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type MyWorkTasksViewProps = GenerativeProps<"my-work-tasks">;

/** Needs you, as on the start page (spec: home). */
export function MyWorkTasksView({ tasks }: MyWorkTasksViewProps) {
  const t = useTranslations("myWork.card");
  const numbers = useNumberFormat();
  return (
    <Card data-slot="my-work-tasks-card" className="grid gap-2 p-1 shadow-none">
      <NeedsYou tasks={tasks.tasks} numbers={numbers} />
      <Link href={ROUTES.home} className="px-3 pb-2 text-sm font-medium hover:underline">
        {t("open")}
      </Link>
    </Card>
  );
}
