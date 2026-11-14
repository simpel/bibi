"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { MyWorkRunSheets } from "@/features/my-work/ui/my-work-run-sheets";
import { MyWorkTodo } from "@/features/my-work/ui/my-work-todo";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type MyWorkViewProps = GenerativeProps<"my-work">;

/** The caller's run sheet rows per day and what to act on; My work has the rest (ADR 0110). */
export function MyWorkView({ work }: MyWorkViewProps) {
  const t = useTranslations("myWork.card");
  const dates = useDateTimeFormat();
  return (
    <Card data-slot="my-work-card" className="grid gap-3 p-4 shadow-none">
      <MyWorkRunSheets work={work} dates={dates} />
      <MyWorkTodo work={work} dates={dates} />
      <Link href={ROUTES.home} className="text-sm font-medium hover:underline">
        {t("open")}
      </Link>
    </Card>
  );
}
