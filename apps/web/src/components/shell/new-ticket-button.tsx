import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { canPermission } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { ShellAccess } from "./shell-types";

export type NewTicketButtonProps = { access: ShellAccess };

/** The sidebar's primary action: the ticket intake (ADR 0081). Hidden without `ticket:write`. */
export function NewTicketButton({ access }: NewTicketButtonProps) {
  const t = useTranslations("nav");
  if (!canPermission({ permissions: access.permissions, permission: "ticket:write" })) return null;
  return (
    <Button asChild className="w-full justify-start">
      <Link href={ROUTES.ticketNew}>
        <PlusIcon />
        {t("newTicket")}
      </Link>
    </Button>
  );
}
