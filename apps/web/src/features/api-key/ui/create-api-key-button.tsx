"use client";

import type { ApiKeyCreated, GrantableRole } from "@okazi/core";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ApiKeyForm } from "./api-key-form";
import { ApiKeySecret } from "./api-key-secret";

export type CreateApiKeyButtonProps = { roles: readonly GrantableRole[] };

/** Create dialog: the form, then the secret once. Closing forgets the secret. */
export function CreateApiKeyButton({ roles }: CreateApiKeyButtonProps) {
  const t = useTranslations("integration.apiKeys");
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<ApiKeyCreated | null>(null);
  const close = () => {
    setOpen(false);
    setCreated(null);
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{created ? t("secretTitle") : t("create")}</DialogTitle>
            <DialogDescription>
              {created ? t("secretDescription") : t("createDescription")}
            </DialogDescription>
          </DialogHeader>
          {created ? (
            <ApiKeySecret created={created} onDone={close} />
          ) : (
            <ApiKeyForm
              roles={roles}
              onCreated={({ created: value }) => setCreated(value)}
              onCancel={close}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
