"use client";

import { extractPendingApprovals } from "@bibi/ai/approvals";
import { MessageResponse } from "@bibi/ui";
import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import { ApprovalCardView } from "./generative/approval-card-view";
import { ToolPartView } from "./tool-part-view";

export type MessagePartsProps = { message: UIMessage };

/** Parts of an assistant message in order: streamed markdown, tool cards, approval cards. */
export function MessageParts({ message }: MessagePartsProps) {
  const approvals = new Map(
    extractPendingApprovals({ message }).map((approval) => [approval.toolCallId, approval]),
  );
  return (
    <>
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;
        if (isTextUIPart(part))
          return part.text ? <MessageResponse key={key}>{part.text}</MessageResponse> : null;
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
