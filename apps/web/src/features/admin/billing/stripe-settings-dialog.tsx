"use client";

import type { BillingConfigDto } from "@bibi/core/schemas";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bibi/ui";
import { SettingsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { BillingConfigForm } from "./billing-config-form";

export type StripeSettingsDialogProps = {
  config: BillingConfigDto;
  productsNode?: ReactNode;
};

/** Action button that opens Bibi's platform Stripe settings and prices in a dialog. */
export function StripeSettingsDialog({ config, productsNode }: StripeSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("admin.billing");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SettingsIcon className="size-4" />
          <span>{t("settingsAction")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{t("config.title")}</DialogTitle>
            {config.secretKeyHint ? (
              <Badge variant={config.livemode ? "success" : "warning"}>
                {config.livemode ? t("config.live") : t("config.test")}
              </Badge>
            ) : null}
          </div>
          <DialogDescription>
            {config.configured ? t("config.configured") : t("config.notConfigured")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-2">
          <BillingConfigForm config={config} onSaved={() => setOpen(false)} />
          {productsNode}
        </div>
      </DialogContent>
    </Dialog>
  );
}
