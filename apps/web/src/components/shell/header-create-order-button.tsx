import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { EllipsisIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";
import type { CreateGroup, CreateItem } from "@/components/create-hub/create-item-types";
import { creatableItems } from "@/components/create-hub/create-items";
import { canPermission } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { ShellAccess } from "./shell-types";

export type HeaderCreateOrderButtonProps = { access: ShellAccess };

const GROUPS: CreateGroup[] = ["work", "catalog", "settings"];

/** What staff create every day, in this order, on the menu's top level; the rest is under Show more. */
const MAIN_KEYS: readonly string[] = ["customer", "runSheet", "task", "package"];

/**
 * The top bar's primary action: Create order (ADR 0081), joined to a ⋯ menu with everything
 * else the member may create (the `/new` hub's items: task, customer, item…). Icon only below
 * `sm`, so the breadcrumb keeps its room. Without `order:write` only the menu shows.
 */
export function HeaderCreateOrderButton({ access }: HeaderCreateOrderButtonProps) {
  const t = useTranslations("nav");
  const { permissions } = access;
  const canOrder = canPermission({ permissions, permission: "order:write" });
  const others = creatableItems({ permissions }).filter(({ key }) => key !== "order");
  if (!canOrder && others.length === 0) return null;
  return (
    <ButtonGroup>
      {canOrder ? (
        <Button asChild size="sm" className="max-sm:size-8 max-sm:p-0">
          <Link href={ROUTES.orderNew} aria-label={t("newOrder")}>
            <PlusIcon />
            <span className="max-sm:hidden">{t("newOrder")}</span>
          </Link>
        </Button>
      ) : null}
      {canOrder && others.length > 0 ? (
        <ButtonGroupSeparator className="bg-primary-foreground/40" />
      ) : null}
      {others.length > 0 ? <CreateMoreMenu items={others} primary={canOrder} /> : null}
    </ButtonGroup>
  );
}

type CreateMoreMenuProps = { items: CreateItem[]; primary: boolean };

/**
 * The ⋯ half: the everyday things to create (`MAIN_KEYS`) on top, the rest under Show more,
 * grouped as on `/new`.
 */
function CreateMoreMenu({ items, primary }: CreateMoreMenuProps) {
  const t = useTranslations("nav");
  const hub = useTranslations("createHub");
  const main = items
    .filter(({ key }) => MAIN_KEYS.includes(key))
    .sort((a, b) => MAIN_KEYS.indexOf(a.key) - MAIN_KEYS.indexOf(b.key));
  const more = GROUPS.map((group) =>
    items.filter((item) => item.group === group && !MAIN_KEYS.includes(item.key)),
  ).filter((inGroup) => inGroup.length > 0);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant={primary ? "default" : "outline"}
          className="size-8 p-0"
          aria-label={t("moreToCreate")}
        >
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>{hub("title")}</DropdownMenuLabel>
        <CreateMenuItems items={main} />
        {more.length > 0 ? (
          <>
            {main.length > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>{t("showMore")}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-52">
                {more.map((inGroup, index) => (
                  <Fragment key={inGroup[0]?.group}>
                    {index > 0 ? <DropdownMenuSeparator /> : null}
                    <CreateMenuItems items={inGroup} />
                  </Fragment>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type CreateMenuItemsProps = { items: CreateItem[] };

/** One group of create links, each with the hub's icon and title. */
function CreateMenuItems({ items }: CreateMenuItemsProps) {
  const hub = useTranslations("createHub");
  if (items.length === 0) return null;
  return (
    <DropdownMenuGroup>
      {items.map(({ key, href, icon: Icon }) => (
        <DropdownMenuItem key={key} asChild>
          <Link href={href}>
            <Icon />
            {hub(`items.${key}.title`)}
          </Link>
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  );
}
