"use client";

import { Button, Textarea } from "@okazi/ui";
import type { ChatStatus } from "ai";
import { SendIcon, SquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComposerDraft } from "../state/use-prefill";
import { useComposer } from "./use-composer";

export type ComposerProps = {
  status: ChatStatus;
  onSend: (input: { text: string }) => void;
  onStop: () => void;
  draft?: ComposerDraft | null | undefined;
};

/** Message box: Enter sends, Shift+Enter adds a line; while the model works a stop button shows. */
export function Composer({ status, onSend, onStop, draft }: ComposerProps) {
  const t = useTranslations("assistant");
  const { text, setText, input, busy, submit, onKeyDown } = useComposer({
    status,
    onSend,
    draft,
  });
  return (
    <form
      className="flex items-end gap-2 border-t p-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Textarea
        ref={input}
        rows={2}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => onKeyDown({ event })}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        className="min-h-0 resize-none"
      />
      {busy ? (
        <Button type="button" size="icon" variant="outline" onClick={onStop} aria-label={t("stop")}>
          <SquareIcon />
        </Button>
      ) : (
        <Button type="submit" size="icon" disabled={!text.trim()} aria-label={t("send")}>
          <SendIcon />
        </Button>
      )}
    </form>
  );
}
