"use client";

import { extractPendingApprovals } from "@okazi/ai/approvals";
import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import { MarkdownView } from "@/components/markdown-view";
import { ApprovalCardView } from "./generative/approval-card-view";
import { ToolPartView } from "./tool-part-view";

export type MessageContentProps = { message: UIMessage };

/** Parts of an assistant message in order: markdown text, tool cards, approval cards. */
export function MessageContent({ message }: MessageContentProps) {
  const approvals = new Map(
    extractPendingApprovals({ message }).map((approval) => [approval.toolCallId, approval]),
  );
  return (
    <>
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;
        if (isTextUIPart(part))
          return part.text ? <MarkdownView key={key} markdown={part.text} /> : null;
        if (!isToolUIPart(part)) return null;
        const pending = approvals.get(part.toolCallId);
        if (!pending) return <ToolPartView key={key} part={part} />;
        const { toolCallId, toolName, ...proposal } = pending;
        return (
          <ApprovalCardView
            key={key}
            approval={{ status: "approval_required", ...proposal }}
            toolCallId={toolCallId}
            toolName={toolName}
          />
        );
      })}
    </>
  );
}
