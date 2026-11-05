import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { ChevronDownIcon, MailIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { canPermission } from "@/lib/can";
import { ORDER_FROM_MESSAGE_ROUTE } from "@/lib/inbox-routes";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { ShellAccess } from "./shell-types";

export type NewOrderButtonProps = { access: ShellAccess };

/**
 * The sidebar's primary action: the order intake (ADR 0081), with "From a message" (the intake
 * with its paste dialog open, ADR 0084) in its menu when drafting has a model. Hidden without
 * `order:write`.
 */
export function NewOrderButton({ access }: NewOrderButtonProps) {
  const t = useTranslations("nav");
  if (!canPermission({ permissions: access.permissions, permission: "order:write" })) return null;
  const main = (
    <Button asChild className="flex-1 justify-start">
      <Link href={ROUTES.orderNew}>
        <PlusIcon />
        {t("newOrder")}
      </Link>
    </Button>
  );
  if (!access.canDraftFromMessage) return <div className="flex">{main}</div>;
  return (
    <div className="flex gap-px">
      <div className="flex flex-1 [&>*]:rounded-r-none">{main}</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="rounded-l-none" aria-label={t("newOrderOptions")}>
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={ORDER_FROM_MESSAGE_ROUTE}>
              <MailIcon />
              {t("newOrderFromMessage")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
