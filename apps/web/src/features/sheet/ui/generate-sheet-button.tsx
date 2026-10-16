"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { generateSheetAction } from "../actions";

export type GenerateSheetButtonProps = { bookingId: string; sheetDefinitionId: string };

/** Generates the next version from the booking as it is now; an unchanged booking adds none. */
export function GenerateSheetButton({ bookingId, sheetDefinitionId }: GenerateSheetButtonProps) {
  const t = useTranslations("sheet");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const generate = () =>
    run({
      action: () => generateSheetAction({ input: { bookingId, sheetDefinitionId } }),
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
