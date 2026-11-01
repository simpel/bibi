"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  HeaderActions,
} from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConnectMcp } from "./connect-mcp";

export type AddConnectionMenuProps = { url: string; local: boolean };

/** The connected apps' title-row action: a menu of connection kinds (MCP for now), each a dialog. */
export function AddConnectionMenu({ url, local }: AddConnectionMenuProps) {
  const t = useTranslations("integration.oauthGrants");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const add = {
    id: "add",
    label: t("add"),
    icon: <PlusIcon aria-hidden />,
    items: [{ id: "mcp", label: t("mcp.name"), onSelect: () => setOpen(true) }],
  };
  return (
    <>
      <HeaderActions actions={[add]} moreLabel={common("actions")} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("mcp.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("mcp.description")}</DialogDescription>
          </DialogHeader>
          <ConnectMcp url={url} local={local} />
        </DialogContent>
      </Dialog>
    </>
  );
}
