import { CloudOff } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ErrorKey } from "@/lib/error-key";
import { RetryButton } from "./retry-button";

export type ErrorStateProps = { errorKey: ErrorKey };

/** Calm, centred block shown in place of content when a server-side load fails. */
export async function ErrorState({ errorKey }: ErrorStateProps) {
  const t = await getTranslations("errors");
  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CloudOff aria-hidden className="size-5" />
      </div>
      <div className="grid max-w-sm gap-1.5">
        <h3 className="text-base font-semibold text-foreground">{t("loadFailed")}</h3>
        <p className="text-sm text-muted-foreground">{t(errorKey)}</p>
      </div>
      <RetryButton />
    </div>
  );
}
