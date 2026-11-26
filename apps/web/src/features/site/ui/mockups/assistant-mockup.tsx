import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { MockupFrame } from "./mockup-frame";

const USER =
  "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground";
const REPLY = "max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5";

/** A question about tonight, the answer, and a table booking waiting for approval. */
export async function AssistantMockup() {
  const t = await getTranslations("site.mockup.assistant");
  return (
    <MockupFrame title={t("title")}>
      <p className={USER}>{t("question")}</p>
      <p className={REPLY}>{t("answer")}</p>
      <p className={USER}>{t("request")}</p>
      <div className="grid gap-3 rounded-lg border p-3">
        <div>
          <p className="font-medium">{t("card")}</p>
          <p className="text-muted-foreground">{t("detail")}</p>
        </div>
        <div className="flex gap-2">
          <Button tabIndex={-1} size="sm">
            {t("approve")}
          </Button>
          <Button tabIndex={-1} size="sm" variant="outline">
            {t("decline")}
          </Button>
        </div>
      </div>
    </MockupFrame>
  );
}
