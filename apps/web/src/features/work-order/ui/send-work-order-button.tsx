"use client";

import { Button } from "@bibi/ui";
import { SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { sendWorkOrderAction } from "../actions";

export type SendWorkOrderButtonProps = { id: string };

/** Sends the version to its role; the server refuses it unless the ticket is confirmed. */
export function SendWorkOrderButton({ id }: SendWorkOrderButtonProps) {
  const t = useTranslations("workOrder");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const send = () =>
    run({
      action: () => sendWorkOrderAction({ id }),
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
