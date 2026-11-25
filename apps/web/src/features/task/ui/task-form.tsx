"use client";

import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { taskRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createTaskAction } from "../actions";
import {
  TaskAssigneeField,
  TaskCustomerFields,
  TaskItemField,
  TaskNoteField,
  TaskTypeField,
  TaskWhenFields,
} from "./task-fields";
import type { TaskFormData } from "./task-form-data";
import {
  type TaskFormOutput,
  type TaskFormValues,
  type TaskPrefill,
  taskFormDefaults,
  taskFormSchema,
} from "./task-form-schema";

export type TaskFormProps = { data: TaskFormData; prefill: TaskPrefill };

/** `/new/task`: type, customer and contact, when, the item to show, assignee and a note. */
export function TaskForm({ data, prefill }: TaskFormProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<TaskFormValues, unknown, TaskFormOutput>({
    resolver: zodResolver(taskFormSchema({ data }), useZodMessages()),
    defaultValues: taskFormDefaults({ data, prefill }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createTaskAction({ input: values }),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: ({ value }) => router.push(taskRoute({ id: value.id })),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-2xl gap-4">
        <TaskTypeField form={form} data={data} />
        <TaskCustomerFields form={form} data={data} withCustomer={!prefill.orderId} />
        <TaskWhenFields form={form} data={data} />
        <TaskItemField form={form} data={data} />
        <TaskAssigneeField form={form} data={data} />
        <TaskNoteField form={form} />
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {t("create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
