"use client";

import { Button } from "@bibi/ui";
import { RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { generateRunSheetAction } from "../actions";

export type GenerateRunSheetButtonProps = { orderId: string; runSheetDefinitionId: string };

/** Generates the next version from the order as it is now; an unchanged order adds none. */
export function GenerateRunSheetButton({
  orderId,
  runSheetDefinitionId,
}: GenerateRunSheetButtonProps) {
  const t = useTranslations("runSheet");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const generate = () =>
    run({
      action: () => generateRunSheetAction({ input: { orderId, runSheetDefinitionId } }),
      messages: {
        pending: t("generating"),
        success: ({ value }) => t("generated", { version: value.version }),
      },
      onSuccess: () => router.refresh(),
    });
  return (
    <Button variant="outline" disabled={pending} onClick={generate}>
      <RefreshCwIcon />
      {t("generate")}
    </Button>
  );
}
