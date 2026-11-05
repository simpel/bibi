import { Button } from "@bibi/ui";
import { FileTextIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES } from "@/lib/routes";

/** Opens a run sheet version as its own page: the list of work to be done (ADR 0092). */
export async function OpenRunSheetLink({ id }: { id: string }) {
  const t = await getTranslations("runSheet.document");
  return (
    <Button asChild variant="outline">
      <Link href={listItemRoute({ list: ROUTES.runSheets, id })}>
        <FileTextIcon />
        {t("open")}
      </Link>
    </Button>
  );
}
