"use client";

import type { TaskItemInput } from "@bibi/core/schemas";
import { TaskItemsInputSchema } from "@bibi/core/schemas";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  Spinner,
} from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Suspense, use, useState } from "react";
import { useForm } from "react-hook-form";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updateTaskAction } from "../actions";
import {
  defaultWindow,
  roomsWith,
  roomValuesOf,
  type TaskRoomView,
  toItemInput,
} from "../lib/task-rooms";
import type { TaskFormData } from "./task-form-data";
import { TaskRoomFields, type TaskRoomsFormValues } from "./task-room-fields";

export type TaskRoomDialogProps = {
  taskId: string;
  /** Every room on the task now: a save sends the whole set. */
  rooms: readonly TaskRoomView[];
  /** The room being edited; null adds one. */
  editing: TaskRoomView | null;
  dueAt: Date | null;
  /** Read by the page without waiting for it (ADR 0097); null: failed. */
  data: Promise<TaskFormData | null>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormProps = Omit<TaskRoomDialogProps, "data" | "open"> & { data: TaskFormData };

/** One room's fields with Save and Cancel; the whole `items` set goes through `task.update`. */
function RoomForm({ taskId, rooms, editing, dueAt, data, onOpenChange }: FormProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const [rejected, setRejected] = useState(false);
  const free = data.items.filter((item) => !rooms.some((room) => room.itemId === item.id));
  const form = useForm<TaskRoomsFormValues, unknown, TaskItemInput[]>({
    resolver: zodResolver(
      formSchema({
        schema: TaskItemsInputSchema,
        toInput: ({ values }: { values: TaskRoomsFormValues }) =>
          values.items.map((room) => toItemInput({ room, timeZone: data.timeZone })),
      }),
      useZodMessages(),
    ),
    defaultValues: {
      items: [
        editing
          ? roomValuesOf({ room: editing, timeZone: data.timeZone })
          : {
              itemId: free[0]?.id ?? "",
              hold: "RELATED",
              ...defaultWindow({ dueAt, timeZone: data.timeZone }),
            },
      ],
    },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values: [next] }) =>
      updateTaskAction({
        input: {
          id: taskId,
          items: roomsWith({ rooms, editing: editing?.id ?? null, next: next as TaskItemInput }),
        },
      }),
    messages: { pending: common("saving"), success: t("updated") },
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
    },
    // A collision names the row of the whole set, not a field of this form: show it here.
    onError: ({ error }) =>
      setRejected(
        error.code === "CONFLICT" || error.issues.some(({ path }) => path.startsWith("items")),
      ),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TaskRoomFields
          form={form}
          index={0}
          options={editing ? data.items : free}
          itemLocked={editing !== null}
        />
        {rejected ? <p className="text-sm text-destructive">{t("rooms.rowInvalid")}</p> : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function Loaded({ data, ...props }: Omit<TaskRoomDialogProps, "open">) {
  const loaded = use(data);
  if (!loaded) return <InlineLoadError errorKey={null} />;
  return <RoomForm {...props} data={loaded} />;
}

/** Add a room to the task, or edit one's mode and window, in a dialog over the page. */
export function TaskRoomDialog({ open, onOpenChange, ...props }: TaskRoomDialogProps) {
  const t = useTranslations("task.rooms");
  const common = useTranslations("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {props.editing ? t("editTitle", { name: props.editing.name }) : t("add")}
          </DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <Suspense fallback={<Spinner label={common("loading")} className="mx-auto" />}>
          <Loaded {...props} onOpenChange={onOpenChange} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
