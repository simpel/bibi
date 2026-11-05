"use client";

import { toast } from "@bibi/ui";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

export function PeriodResetToast() {
  const t = useTranslations("finance.period");
  const searchParams = useSearchParams();
  const resetReason = searchParams.get("reset");
  const notified = useRef(false);

  useEffect(() => {
    if (!resetReason || notified.current) return;
    notified.current = true;
    if (resetReason === "forwardOnly") {
      toast.error(t("forwardOnly"));
    } else if (resetReason === "historicalOnly") {
      toast.error(t("historicalOnly"));
    }
  }, [resetReason, t]);

  return null;
}
