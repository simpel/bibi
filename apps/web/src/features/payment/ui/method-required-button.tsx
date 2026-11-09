"use client";

import {
  Button,
  type ButtonProps,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type MethodRequiredButtonProps = Pick<ButtonProps, "size"> & { children: ReactNode };

/**
 * A payment-link action while no connected provider takes a payment method (ADR 0090, 0100):
 * shown dimmed, and a click explains what to connect first instead of doing anything.
 */
export function MethodRequiredButton({ size, children }: MethodRequiredButtonProps) {
  const t = useTranslations("payment.methodRequired");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size={size}
        aria-disabled
        className="opacity-50"
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {common("close")}
            </Button>
            <Button asChild>
              <Link href={`${ROUTES.adminIntegrations}#providers`}>{t("connect")}</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
