"use client";

import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useFormAction } from "@/lib/use-form-action";
import type { ConversationSummary } from "../actions";
import { useAssistant } from "../state/assistant-context";
import { RenameTitleField } from "./rename-title-field";
import { useRenameConversationForm } from "./use-rename-conversation-form";

export type RenameConversationFormProps = {
  conversation: ConversationSummary;
  onDone: () => void;
  onCancel: () => void;
};

/** Inline rename: Enter saves, Escape or Cancel leaves the title as it was. */
export function RenameConversationForm({
  conversation,
  onDone,
  onCancel,
}: RenameConversationFormProps) {
  const t = useTranslations("assistant.history");
  const common = useTranslations("common");
  const { conversations } = useAssistant();
  const form = useRenameConversationForm({ id: conversation.id, title: conversation.title });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => conversations.rename({ id: values.id, title: values.title }),
    messages: { pending: common("saving"), success: t("renamed") },
    onSuccess: onDone,
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="flex items-start gap-1 px-2 py-1.5">
        <RenameTitleField form={form} onCancel={onCancel} />
        <Button type="submit" size="sm" disabled={pending}>
          {common("save")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {common("cancel")}
        </Button>
      </form>
    </Form>
  );
}
