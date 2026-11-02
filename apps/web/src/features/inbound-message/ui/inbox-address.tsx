import { listInboundEndpoints } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { runOperation } from "@/server/run-operation";

/** The organization's inbox mail address, to forward the venue's booking mail to (ADR 0085). */
export async function InboxAddress() {
  const t = await getTranslations("inbox");
  const result = await runOperation({
    operation: listInboundEndpoints,
    input: { channel: "EMAIL" },
  });
  const address = result.ok ? result.value.items.find((item) => item.active)?.address : null;
  return (
    <p className="text-sm text-muted-foreground">
      {address
        ? t.rich("address", {
            address,
            code: (chunks) => <code className="text-foreground">{chunks}</code>,
          })
        : t("noAddress")}
    </p>
  );
}
