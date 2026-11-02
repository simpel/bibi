import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { ChevronDownIcon, MailIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { intakeStepPath } from "@/features/ticket/intake/intake-path";
import { canPermission } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { ShellAccess } from "./shell-types";

export type NewTicketButtonProps = { access: ShellAccess };

/**
 * The sidebar's primary action: the ticket intake (ADR 0081), with "From a message" (step 0,
 * ADR 0084) in its menu when drafting has a model. Hidden without `ticket:write`.
 */
export function NewTicketButton({ access }: NewTicketButtonProps) {
  const t = useTranslations("nav");
  if (!canPermission({ permissions: access.permissions, permission: "ticket:write" })) return null;
  const main = (
    <Button asChild className="flex-1 justify-start">
      <Link href={ROUTES.ticketNew}>
        <PlusIcon />
        {t("newTicket")}
      </Link>
    </Button>
  );
  if (!access.canDraftFromMessage) return <div className="flex">{main}</div>;
  return (
    <div className="flex gap-px">
      <div className="flex flex-1 [&>*]:rounded-r-none">{main}</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="rounded-l-none" aria-label={t("newTicketOptions")}>
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={intakeStepPath({ step: "message" })}>
              <MailIcon />
              {t("newTicketFromMessage")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
