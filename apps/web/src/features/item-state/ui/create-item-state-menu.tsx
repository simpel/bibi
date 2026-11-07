"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type CreateItemStateMenuProps = { types: readonly { id: string; name: string }[] };

/** "Create item state": the create page needs an item type, so the button lists the types. */
export function CreateItemStateMenu({ types }: CreateItemStateMenuProps) {
  const t = useTranslations("itemState");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <PlusIcon />
          {t("create")}
          <ChevronDownIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {types.map((type) => (
          <DropdownMenuItem key={type.id} asChild>
            <Link href={`${ROUTES.itemStateNew}?type=${encodeURIComponent(type.id)}`}>
              {type.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
