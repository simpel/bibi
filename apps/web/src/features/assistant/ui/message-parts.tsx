"use client";

import { extractPendingApprovals } from "@bibi/ai/approvals";
import { MessageResponse } from "@bibi/ui";
import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import { ApprovalCardView } from "./generative/approval-card-view";
import { ToolPartView } from "./tool-part-view";

export type MessagePartsProps = { message: UIMessage };

/**
 * Parts of an assistant message in order: streamed markdown, tool cards, approval cards. Text
 * after an approval card is left out: the card says what was proposed.
 */
export function MessageParts({ message }: MessagePartsProps) {
  const approvals = new Map(
    extractPendingApprovals({ message }).map((approval) => [approval.toolCallId, approval]),
  );
  const firstCard = message.parts.findIndex(
    (part) => isToolUIPart(part) && approvals.has(part.toolCallId),
  );
  return (
    <>
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;
        if (isTextUIPart(part)) {
          if (firstCard !== -1 && index > firstCard) return null;
          return part.text ? <MessageResponse key={key}>{part.text}</MessageResponse> : null;
        }
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
