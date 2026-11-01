import { toast } from "@bibi/ui";

export type CopyMessages = { copied: string; copyFailed: string };

export type CopyToClipboardInput = { value: string; messages: CopyMessages };

/** Copies `value`, then says so in a toast (or that it failed). */
export function copyToClipboard({ value, messages }: CopyToClipboardInput): Promise<void> {
  return navigator.clipboard.writeText(value).then(
    () => {
      toast.success(messages.copied);
    },
    () => {
      toast.error(messages.copyFailed);
    },
  );
}
