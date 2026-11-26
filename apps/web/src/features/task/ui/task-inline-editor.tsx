"use client";

import type { TaskDto } from "@bibi/core";
import { Button, Form, Spinner } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Suspense, use } from "react";
import { useForm } from "react-hook-form";
import { useInlineEdit } from "@/components/inline-edit/inline-edit";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updateTaskAction } from "../actions";
import { type TaskEditGroup, toTaskUpdate } from "./task-edit-groups";
import {
  TaskAssigneeField,
  TaskCustomerFields,
  TaskDueField,
  TaskNoteField,
  TaskTypeField,
} from "./task-fields";
import type { TaskFormData } from "./task-form-data";
import {
  type TaskFormOutput,
  type TaskFormValues,
  taskFormDefaults,
  taskFormSchema,
} from "./task-form-schema";

export type TaskInlineEditorProps = {
  task: TaskDto;
  /** Read by the page without waiting for it (ADR 0097); null: failed. */
  data: Promise<TaskFormData | null>;
  groups: readonly TaskEditGroup[];
};

type EditorProps = Omit<TaskInlineEditorProps, "data"> & { data: TaskFormData };

/** The fields of the edited groups with Save and Cancel; only those fields are sent. */
function Editor({ task, data, groups }: EditorProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const { close } = useInlineEdit();
  const form = useForm<TaskFormValues, unknown, TaskFormOutput>({
    resolver: zodResolver(taskFormSchema({ data }), useZodMessages()),
    defaultValues: taskFormDefaults({ data, task }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateTaskAction({ input: toTaskUpdate({ task, values, groups }) }),
    messages: { pending: common("saving"), success: t("updated") },
    onSuccess: () => {
      close();
      router.refresh();
    },
  });
  const shows = new Set<TaskEditGroup>(groups);
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {shows.has("due") ? <TaskTypeField form={form} data={data} /> : null}
        {shows.has("due") ? <TaskDueField form={form} /> : null}
        {shows.has("customer") || shows.has("contact") ? (
          <TaskCustomerFields form={form} data={data} withCustomer={shows.has("customer")} />
        ) : null}
        {shows.has("customer") && task.orderId ? (
          <p className="text-sm text-muted-foreground">{t("customerUnlinksOrder")}</p>
        ) : null}
        {shows.has("assignee") ? <TaskAssigneeField form={form} data={data} /> : null}
        {shows.has("note") ? <TaskNoteField form={form} /> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={pending}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function Loaded({ data, ...props }: TaskInlineEditorProps) {
  const loaded = use(data);
  if (!loaded) return <InlineLoadError errorKey={null} />;
  return <Editor {...props} data={loaded} />;
}

/** Edits part of a task in place (a fact's popover, a section's form). */
export function TaskInlineEditor(props: TaskInlineEditorProps) {
  const common = useTranslations("common");
  return (
    <Suspense fallback={<Spinner label={common("loading")} className="mx-auto" />}>
      <Loaded {...props} />
    </Suspense>
  );
}
