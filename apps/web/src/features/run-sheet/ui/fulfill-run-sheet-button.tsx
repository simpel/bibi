"use client";

import { Button } from "@bibi/ui";
import { CheckIcon, Undo2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { fulfillRunSheetAction, unfulfillRunSheetAction } from "../actions";

export type FulfillRunSheetButtonProps = {
  id: string;
  fulfilled: boolean;
};

/** Mark as done or reopen a run sheet version. */
export function FulfillRunSheetButton({ id, fulfilled }: FulfillRunSheetButtonProps) {
  const t = useTranslations("runSheet");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();

  const toggle = () =>
    run({
      action: () => (fulfilled ? unfulfillRunSheetAction({ id }) : fulfillRunSheetAction({ id })),
      messages: {
        pending: common("saving"),
        success: fulfilled ? t("reopened") : t("fulfilled"),
      },
      onSuccess: () => router.refresh(),
    });

  if (fulfilled) {
    return (
      <Button variant="ghost" size="sm" disabled={pending} onClick={toggle}>
        <Undo2Icon className="h-4 w-4" />
        {t("reopen")}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={toggle}>
      <CheckIcon className="h-4 w-4" />
      {t("markAsDone")}
    </Button>
  );
}
