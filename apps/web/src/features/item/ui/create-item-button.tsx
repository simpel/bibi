"use client";

import { usePathname, useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ItemDialog } from "./item-dialog";
import type { ItemFormData } from "./item-form-data";

export type CreateItemButtonProps = { data: ItemFormData; typeId?: string | undefined };

/** Opens the create-item dialog; also opens on `?create=1` (⌘K "Create item"). */
export function CreateItemButton({ data, typeId }: CreateItemButtonProps) {
  const t = useTranslations("item");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(useSearchParams().get("create") === "1");
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <ItemDialog
        data={data}
        typeId={typeId}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) router.replace(pathname);
        }}
      />
    </>
  );
}
