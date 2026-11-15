import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarTooltip,
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
    <SidebarTooltip tooltip={t("newOrder")}>
      <Button
        asChild
        className="flex-1 justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
      >
        <Link href={ROUTES.orderNew} aria-label={t("newOrder")}>
          <PlusIcon />
          <span className="group-data-[collapsible=icon]:hidden">{t("newOrder")}</span>
        </Link>
      </Button>
    </SidebarTooltip>
  );
  if (!access.canDraftFromMessage) return <div className="flex">{main}</div>;
  return (
    <div className="flex gap-px">
      <div className="flex flex-1 group-data-[collapsible=icon]:flex-none [&>*]:rounded-r-none group-data-[collapsible=icon]:[&>*]:rounded-r-md">
        {main}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="rounded-l-none group-data-[collapsible=icon]:hidden"
            aria-label={t("newOrderOptions")}
          >
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
