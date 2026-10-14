import { getTranslations } from "next-intl/server";
import type { ErrorKey } from "@/lib/error-key";

export type ErrorStateProps = { errorKey: ErrorKey };

/** Block shown in place of content when a server-side load fails. */
export async function ErrorState({ errorKey }: ErrorStateProps) {
  const t = await getTranslations("errors");
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-6 py-8 text-center"
    >
      <h3 className="text-lg font-semibold text-destructive">{t("loadFailed")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t(errorKey)}</p>
    </div>
  );
}
