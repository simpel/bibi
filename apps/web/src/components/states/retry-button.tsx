"use client";

import { Button } from "@bibi/ui";
import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/** Re-runs the server load for the current route. */
export function RetryButton() {
  const t = useTranslations("common");
  const router = useRouter();
  return (
    <Button variant="outline" size="sm" onClick={() => router.refresh()}>
      <RotateCw aria-hidden />
      {t("retry")}
    </Button>
  );
}
