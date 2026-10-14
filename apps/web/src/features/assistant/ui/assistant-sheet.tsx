"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useAssistant } from "../state/assistant-context";
import { AssistantBody } from "./assistant-body";

/** Phones: the same panel in a full-height sheet. */
export function AssistantSheet() {
  const t = useTranslations("assistant");
  const { open, setOpen } = useAssistant();
  return (
    <Sheet open={open} onOpenChange={(next) => setOpen({ open: next })}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
        data-slot="assistant-panel"
      >
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>
        <SheetDescription className="sr-only">{t("description")}</SheetDescription>
        <AssistantBody showClose={false} />
      </SheetContent>
    </Sheet>
  );
}
