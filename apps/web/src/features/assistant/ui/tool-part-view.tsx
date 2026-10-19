"use client";

import type { DynamicToolUIPart, ToolUIPart } from "ai";
import { getToolName } from "ai";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQuietTools } from "../state/quiet-tools-context";
import { ErrorView } from "./generative/error-view";
import { ToolResultView } from "./generative/tool-result-view";

export type ToolPartViewProps = { part: ToolUIPart | DynamicToolUIPart };

/** A tool call in an assistant message: spinner while it runs, a card once it has a result. */
export function ToolPartView({ part }: ToolPartViewProps) {
  const t = useTranslations("assistant.tool");
  const toolName = getToolName(part);
  const quiet = useQuietTools().includes(toolName);
  if (quiet) return null;
  if (part.state === "output-available") {
    return <ToolResultView toolName={toolName} output={part.output} toolCallId={part.toolCallId} />;
  }
  if (part.state === "output-error") {
    return <ErrorView code="INTERNAL" message={part.errorText} />;
  }
  return (
    <output className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2Icon className="size-3.5 animate-spin" />
      {t("running", { tool: toolName })}
    </output>
  );
}
