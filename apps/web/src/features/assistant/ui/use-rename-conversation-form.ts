"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ConversationRenameInputSchema } from "@okazi/core/schemas";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useZodMessages } from "@/lib/use-zod-messages";

export type RenameValues = { title: string };
export type RenameInput = z.infer<typeof ConversationRenameInputSchema>;

export type UseRenameConversationFormInput = { id: string; title: string };

/** react-hook-form wired to core's rename schema with localized validation messages. */
export function useRenameConversationForm({ id, title }: UseRenameConversationFormInput) {
  const messages = useZodMessages();
  const schema = useMemo(
    () =>
      formSchema({
        schema: ConversationRenameInputSchema,
        toInput: ({ values }: { values: RenameValues }) => ({ id, title: values.title }),
      }),
    [id],
  );
  return useForm<RenameValues, unknown, RenameInput>({
    resolver: zodResolver(schema, messages),
    defaultValues: { title },
  });
}
