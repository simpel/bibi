"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@okazi/ui";
import { PackagePlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ExpandBundleForm } from "./expand-bundle-form";
import type { ProgramFormData } from "./program-form-data";

export type ExpandBundleButtonProps = {
  data: ProgramFormData;
  ticketId: string;
  startsAt: Date;
};

/** Opens the dialog that adds a bundle with its part lines to the ticket (like line create). */
export function ExpandBundleButton(props: ExpandBundleButtonProps) {
  const t = useTranslations("line");
  const [open, setOpen] = useState(false);
  if (props.data.bundles.length === 0) return null;
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PackagePlusIcon />
        {t("expandBundle")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("expandBundle")}</DialogTitle>
            <DialogDescription>{t("expandBundleDescription")}</DialogDescription>
          </DialogHeader>
          <ExpandBundleForm {...props} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
