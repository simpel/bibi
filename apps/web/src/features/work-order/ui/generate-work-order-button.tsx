"use client";

import { Button } from "@bibi/ui";
import { RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { generateWorkOrderAction } from "../actions";

export type GenerateWorkOrderButtonProps = { ticketId: string; workOrderDefinitionId: string };

/** Generates the next version from the ticket as it is now; an unchanged ticket adds none. */
export function GenerateWorkOrderButton({
  ticketId,
  workOrderDefinitionId,
}: GenerateWorkOrderButtonProps) {
  const t = useTranslations("workOrder");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const generate = () =>
    run({
      action: () => generateWorkOrderAction({ input: { ticketId, workOrderDefinitionId } }),
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
