"use client";

import type { VenueDto } from "@okazi/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { VenueForm } from "./venue-form";

export type VenueDialogProps = {
  /** Present = edit mode, absent = create mode. */
  venue?: VenueDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VenueDialog({ venue, open, onOpenChange }: VenueDialogProps) {
  const t = useTranslations("venue");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{venue ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {venue ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <VenueForm venue={venue} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
