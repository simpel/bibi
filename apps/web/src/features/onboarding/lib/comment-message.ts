import type { SetupTarget, SetupTargetKind } from "@bibi/ui";

/** The localized message template per kind, e.g. `About the phase “{name}”: {instruction}`. */
export type CommentTemplate = (input: {
  kind: SetupTargetKind;
  name: string;
  instruction: string;
}) => string;

export type CommentMessageInput = {
  target: SetupTarget;
  instruction: string;
  template: CommentTemplate;
};

/** The chat message that tells the assistant which element to change and how; null when blank. */
export function commentMessage({ target, instruction, template }: CommentMessageInput) {
  const text = instruction.trim();
  if (!text) return null;
  return template({ kind: target.kind, name: target.name, instruction: text });
}
