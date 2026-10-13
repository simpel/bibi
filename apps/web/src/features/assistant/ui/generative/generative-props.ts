import type { ToolUiProps, UiComponent } from "@okazi/ai";

/** Where a tool result came from; set by the chat, absent when rendered elsewhere. */
export type ToolContext = {
  toolCallId?: string | undefined;
  toolName?: string | undefined;
};

/** Props of the React component for one generative-UI key (`ToolUiProps` + the tool context). */
export type GenerativeProps<K extends UiComponent> = ToolUiProps[K] & ToolContext;
