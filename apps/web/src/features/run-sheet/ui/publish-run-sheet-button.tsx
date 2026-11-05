"use client";

import { Button } from "@bibi/ui";
import { UploadCloudIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { publishRunSheetAction } from "../actions";

export type PublishRunSheetButtonProps = { id: string };

/** Publishes the version to its responsibility; establishes the baseline for future changes. */
export function PublishRunSheetButton({ id }: PublishRunSheetButtonProps) {
  const t = useTranslations("runSheet");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const publish = () =>
    run({
      action: () => publishRunSheetAction({ id }),
      messages: { pending: common("saving"), success: t("published") },
      onSuccess: () => router.refresh(),
    });
  return (
    <Button disabled={pending} onClick={publish}>
      <UploadCloudIcon />
      {t("publish")}
    </Button>
  );
}

/** Compatibility alias for PublishRunSheetButton. */
export const SendRunSheetButton = PublishRunSheetButton;
