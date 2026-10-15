"use client";

import type { InquiryDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { BadgeCheckIcon, PencilIcon, UserCogIcon, XCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { type InquiryActionDialog, InquiryActionDialogs } from "./inquiry-action-dialogs";
import type { InquiryFormData } from "./inquiry-form-data";

export type InquiryActionsProps = {
  inquiry: InquiryDto;
  data: InquiryFormData;
  /** Which status commands the state machine allows from the current status. */
  can: { qualify: boolean; markLost: boolean };
};

/** Qualify, edit, change-owner and mark-lost buttons of the inquiry detail page. */
export function InquiryActions({ inquiry, data, can }: InquiryActionsProps) {
  const t = useTranslations("inquiry");
  const [dialog, setDialog] = useState<InquiryActionDialog>(null);
  const hasMembers = data.members.length > 0;
  return (
    <>
      {can.qualify && hasMembers ? (
        <Button onClick={() => setDialog("qualify")}>
          <BadgeCheckIcon />
          {t("qualify")}
        </Button>
      ) : null}
      <Button variant="outline" onClick={() => setDialog("edit")}>
        <PencilIcon />
        {t("edit")}
      </Button>
      {hasMembers ? (
        <Button variant="outline" onClick={() => setDialog("assign")}>
          <UserCogIcon />
          {t("assign")}
        </Button>
      ) : null}
      {can.markLost ? (
        <Button variant="outline" onClick={() => setDialog("lost")}>
          <XCircleIcon />
          {t("markLost")}
        </Button>
      ) : null}
      <InquiryActionDialogs
        inquiry={inquiry}
        data={data}
        dialog={dialog}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
