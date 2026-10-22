import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type TemplateTicketActionsProps = { pending: boolean };

/** Submit, the step-by-step alternative and cancel of the short create form. */
export function TemplateTicketActions({ pending }: TemplateTicketActionsProps) {
  const t = useTranslations("ticket");
  const common = useTranslations("common");
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={pending}>
        {t("createFromTemplate")}
      </Button>
      <Button asChild variant="outline">
        <Link href={`${ROUTES.ticketNew}?mode=custom`}>{t("buildStepByStep")}</Link>
      </Button>
      <Button asChild variant="ghost">
        <Link href={ROUTES.tickets}>{common("cancel")}</Link>
      </Button>
    </div>
  );
}
