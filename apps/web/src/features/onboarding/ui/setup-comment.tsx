import {
  Button,
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type SetupTarget,
} from "@bibi/ui";
import type { ChatStatus } from "ai";
import { useTranslations } from "next-intl";
import { commentMessage } from "../lib/comment-message";

export type SetupCommentProps = {
  target: SetupTarget;
  status: ChatStatus;
  send: (input: { text: string }) => void;
  close: () => void;
};

/** The comment box next to a selected phase or item type: the instruction goes to the chat. */
export function SetupComment({ target, status, send, close }: SetupCommentProps) {
  const t = useTranslations("onboarding.comment");
  const common = useTranslations("common");
  const busy = status === "submitted" || status === "streaming";
  return (
    <PromptInput
      className="shadow-none"
      onSubmit={({ text }) => {
        const message = commentMessage({
          target,
          instruction: text,
          template: ({ kind, ...values }) => t(`message.${kind}`, values),
        });
        if (busy || !message) return;
        send({ text: message });
        close();
      }}
    >
      <p className="px-4 pt-3 text-sm font-medium">{t(`title.${target.kind}`, target)}</p>
      <PromptInputBody>
        <PromptInputTextarea
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          autoFocus
        />
      </PromptInputBody>
      <PromptInputFooter className="justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={close}>
          {common("cancel")}
        </Button>
        <PromptInputSubmit status={status} disabled={busy} aria-label={t("send")} />
      </PromptInputFooter>
    </PromptInput>
  );
}
