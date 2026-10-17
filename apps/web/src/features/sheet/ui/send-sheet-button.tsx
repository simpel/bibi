"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { sendSheetAction } from "../actions";

export type SendSheetButtonProps = { id: string };

/** Sends the version to its role; the server refuses it unless the booking is confirmed. */
export function SendSheetButton({ id }: SendSheetButtonProps) {
  const t = useTranslations("sheet");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const send = () =>
    run({
      action: () => sendSheetAction({ id }),
      messages: { pending: common("sending"), success: t("sent") },
      onSuccess: () => router.refresh(),
    });
  return (
    <Button disabled={pending} onClick={send}>
      <SendIcon />
      {t("send")}
    </Button>
  );
}
