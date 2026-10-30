import type { BoardDto } from "@bibi/core/schemas";
import { BoardCreateInputSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { formSchema } from "@/lib/form-schema";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createBoardAction, updateBoardAction } from "../actions";

type Values = { name: string };

const nameSchema = formSchema({
  schema: BoardCreateInputSchema.pick({ name: true }),
  toInput: ({ values }: { values: Values }) => values,
});

export type BoardNameFormProps = {
  /** The board to rename; without one, a new board is created. */
  board?: Pick<BoardDto, "id" | "name">;
  onDone: (input: { value: BoardDto }) => void;
};

/** Name a new board (`board.create`) or rename one (`board.update`). */
export function BoardNameForm({ board, onDone }: BoardNameFormProps) {
  const t = useTranslations("board");
  const common = useTranslations("common");
  const form = useForm<Values, unknown, Values>({
    resolver: zodResolver(nameSchema, useZodMessages()),
    defaultValues: { name: board?.name ?? "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      board
        ? updateBoardAction({ input: { id: board.id, name: values.name } })
        : createBoardAction({ input: { name: values.name } }),
    messages: { pending: t("saving"), success: t(board ? "updated" : "created") },
    onSuccess: ({ value }) => onDone({ value }),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <Button type="submit" size="sm" className="justify-self-end" disabled={pending}>
          {common("save")}
        </Button>
      </form>
    </Form>
  );
}
