"use client";

import { usePathname, useRouter } from "@okazi/i18n/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SeriesForm } from "./series-form";
import type { SeriesFormData } from "./series-form-data";

export type CreateSeriesButtonProps = { data: SeriesFormData };

/** Opens the create-series dialog; also opens on `?create=1`. */
export function CreateSeriesButton({ data }: CreateSeriesButtonProps) {
  const t = useTranslations("bookingSeries");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(useSearchParams().get("create") === "1");
  const close = () => {
    setOpen(false);
    router.replace(pathname);
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("create")}</DialogTitle>
            <DialogDescription>{t("createDescription")}</DialogDescription>
          </DialogHeader>
          <SeriesForm data={data} onDone={close} />
        </DialogContent>
      </Dialog>
    </>
  );
}
