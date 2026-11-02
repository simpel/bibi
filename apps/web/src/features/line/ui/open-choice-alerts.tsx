import { listLines } from "@bibi/core";
import { Alert, AlertDescription, AlertTitle } from "@bibi/ui";
import { TriangleAlertIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { runOperation } from "@/server/run-operation";

export type OpenChoiceAlertsProps = { ticketId: string };

/**
 * One warning per line with a required choice still open (`UNCHOSEN_REQUIRED_GROUP`, ADR
 * 0089): the choice was left for later at intake. Nothing when every choice is made.
 */
export async function OpenChoiceAlerts({ ticketId }: OpenChoiceAlertsProps) {
  const result = await runOperation({ operation: listLines, input: { ticketId, limit: 100 } });
  if (!result.ok) return null;
  const open = result.value.items.flatMap((line) => {
    const count = line.warnings.filter(({ kind }) => kind === "UNCHOSEN_REQUIRED_GROUP").length;
    return count === 0 ? [] : [{ id: line.id, name: line.name, count }];
  });
  if (open.length === 0) return null;
  const t = await getTranslations("line.issueAlerts.openChoice");
  return open.map(({ id, name, count }) => (
    <Alert key={id} variant="warning">
      <TriangleAlertIcon />
      <AlertTitle>{t("title")}</AlertTitle>
      <AlertDescription>{t("description", { line: name, count })}</AlertDescription>
    </Alert>
  ));
}
