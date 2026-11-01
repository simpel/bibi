"use client";

import { Button } from "@bibi/ui";
import { CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CopyField } from "@/components/copy-field";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { CONNECTOR_NAME } from "./mcp-connection";

export type ConnectMcpProps = { url: string; local: boolean };

/** Any AI app with MCP connectors: copy the address, or a plain-language prompt for the app. */
export function ConnectMcp({ url, local }: ConnectMcpProps) {
  const t = useTranslations("integration.oauthGrants.mcp");
  const messages = { copied: t("copied"), copyFailed: t("copyFailed") };
  const prompt = t("prompt", { name: CONNECTOR_NAME, url });
  return (
    <div className="grid gap-4">
      <CopyField
        id="mcp-server-url"
        label={t("urlLabel")}
        value={url}
        messages={{ ...messages, copy: t("copy") }}
      />
      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        onClick={() =>
          copyToClipboard({ value: prompt, messages: { ...messages, copied: t("promptCopied") } })
        }
      >
        <CopyIcon aria-hidden />
        {t("copyPrompt")}
      </Button>
      {local ? <p className="text-sm text-destructive">{t("local")}</p> : null}
    </div>
  );
}
