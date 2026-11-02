import { Button } from "@bibi/ui";
import { FileTextIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES } from "@/lib/routes";

/** Opens a work order version as its own page: the list of work to be done (ADR 0092). */
export async function OpenWorkOrderLink({ id }: { id: string }) {
  const t = await getTranslations("workOrder.document");
  return (
    <Button asChild variant="outline">
      <Link href={listItemRoute({ list: ROUTES.workOrders, id })}>
        <FileTextIcon />
        {t("open")}
      </Link>
    </Button>
  );
}
