"use client";

import { usePathname, useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { VenueDialog } from "./venue-dialog";

/** Opens the create dialog; also opens when the page is loaded with `?create=1` (⌘K action). */
export function CreateVenueButton() {
  const t = useTranslations("venue");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(useSearchParams().get("create") === "1");
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) router.replace(pathname);
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <VenueDialog open={open} onOpenChange={onOpenChange} />
    </>
  );
}
