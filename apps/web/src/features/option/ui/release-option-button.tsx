"use client";

import type { OptionDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { Undo2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { releaseOptionAction } from "../actions";

export type ReleaseOptionButtonProps = { option: OptionDto };

/** Releases one option; the options behind it move up and the page reloads. */
export function ReleaseOptionButton({ option }: ReleaseOptionButtonProps) {
  const t = useTranslations("option");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, run } = useToastAction();
  const release = () =>
    run({
      action: () => releaseOptionAction({ id: option.id }),
      messages: { pending: t("releasing"), success: t("released") },
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });
  return (
    <div className="flex justify-end">
      <Button variant="ghost" size="icon" aria-label={t("release")} onClick={() => setOpen(true)}>
        <Undo2Icon />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("release")}
        description={t("releaseConfirm")}
        confirmLabel={t("release")}
        pending={pending}
        onConfirm={release}
      />
    </div>
  );
}
