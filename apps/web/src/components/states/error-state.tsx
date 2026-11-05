import { CloudOff } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ErrorKey } from "@/lib/error-key";
import { RetryButton } from "./retry-button";
import { ViewportCenter } from "./viewport-center";

export type ErrorStateProps = {
  errorKey: ErrorKey;
  /**
   * A section of a page that otherwise loaded (a card, a tab, a streamed section): the error stays
   * in its place. Without it the error is the page's and is centred on the viewport.
   */
  inline?: boolean;
};

/** Calm block shown in place of content when a server-side load fails. */
export async function ErrorState({ errorKey, inline = false }: ErrorStateProps) {
  const t = await getTranslations("errors");
  const body = (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CloudOff aria-hidden className="size-5" />
      </div>
      <div className="grid max-w-sm gap-1.5">
        <h3 className="text-base text-foreground">{t("loadFailed")}</h3>
        <p className="text-sm text-muted-foreground">{t(errorKey)}</p>
      </div>
      <RetryButton />
    </div>
  );
  return inline ? body : <ViewportCenter>{body}</ViewportCenter>;
}
