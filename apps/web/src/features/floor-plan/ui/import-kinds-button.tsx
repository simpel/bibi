"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { importFloorKindsAction } from "../actions";

/** Imports the starter furniture library, then shows the editor. */
export function ImportKindsButton() {
  const t = useTranslations("floorPlan.noKinds");
  const router = useRouter();
  const { run, pending } = useToastAction();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        run({
          action: () => importFloorKindsAction(),
          messages: { pending: t("importing"), success: t("imported") },
          onSuccess: () => router.refresh(),
        })
      }
    >
      {t("import")}
    </Button>
  );
}
