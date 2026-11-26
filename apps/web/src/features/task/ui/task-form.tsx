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
  TaskDueField,
  TaskNoteField,
  TaskTypeField,
} from "./task-fields";
import type { TaskFormData } from "./task-form-data";
import {
  type TaskFormOutput,
  type TaskFormValues,
  type TaskPrefill,
  taskFormDefaults,
  taskFormSchema,
} from "./task-form-schema";
import { TaskRoomsField } from "./task-rooms-field";

export type TaskFormProps = { data: TaskFormData; prefill: TaskPrefill };

/** `/new/task`: only the type is required; customer, due time, assignee, note and rooms are optional. */
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
        <TaskDueField form={form} />
        <TaskAssigneeField form={form} data={data} />
        <TaskNoteField form={form} />
        <TaskRoomsField form={form} data={data} />
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {t("create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
