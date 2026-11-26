"use client";

import type { TaskItemHold } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { updateTaskAction } from "../actions";
import { roomsWithout, type TaskRoomView } from "../lib/task-rooms";
import type { TaskFormData } from "./task-form-data";
import { TaskRoomDialog } from "./task-room-dialog";

/** Book first: what blocks a room, then what only sets it aside, then what is only named. */
const GROUPS: readonly TaskItemHold[] = ["BOOK", "PREBOOK", "RELATED"];

export type TaskRoomsProps = {
  taskId: string;
  rooms: readonly TaskRoomView[];
  /** Open task and `task:write`; a done task is locked. */
  canEdit: boolean;
  dueAt: Date | null;
  data: Promise<TaskFormData | null>;
};

/**
 * The page's side column: the rooms the task concerns in three groups (Book, Prebook, Related),
 * each held room with its own window. Every save sends the whole set (ADR 0120).
 */
export function TaskRooms({ taskId, rooms, canEdit, dueAt, data }: TaskRoomsProps) {
  const t = useTranslations("task.rooms");
  const task = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const [dialog, setDialog] = useState<{ editing: TaskRoomView | null } | null>(null);
  const { run, pending } = useToastAction();
  const remove = ({ room }: { room: TaskRoomView }) =>
    run({
      action: () =>
        updateTaskAction({ input: { id: taskId, items: roomsWithout({ rooms, id: room.id }) } }),
      messages: { pending: common("saving"), success: task("updated") },
      onSuccess: () => router.refresh(),
    });
  return (
    <section className="grid content-start gap-4">
      <h2 className="text-sm font-medium text-muted-foreground">{t("title")}</h2>
      {rooms.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
      {GROUPS.map((hold) => {
        const inGroup = rooms.filter((room) => room.hold === hold);
        if (inGroup.length === 0) return null;
        return (
          <div key={hold} className="grid gap-1">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t(`group.${hold}`)}
            </h3>
            <ul className="grid gap-1.5">
              {inGroup.map((room) => (
                <li key={room.id} className="flex items-start justify-between gap-2 text-sm">
                  <span className="grid min-w-0">
                    <Link href={room.href} className="truncate hover:underline">
                      {room.name}
                    </Link>
                    {room.window ? (
                      <span className="text-xs text-muted-foreground">{room.window}</span>
                    ) : null}
                  </span>
                  {canEdit ? (
                    <span className="flex shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground"
                        aria-label={t("edit", { name: room.name })}
                        disabled={pending}
                        onClick={() => setDialog({ editing: room })}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground"
                        aria-label={t("removeRoom", { name: room.name })}
                        disabled={pending}
                        onClick={() => remove({ room })}
                      >
                        <XIcon />
                      </Button>
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {canEdit ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          onClick={() => setDialog({ editing: null })}
        >
          <PlusIcon aria-hidden />
          {t("add")}
        </Button>
      ) : null}
      {dialog ? (
        <TaskRoomDialog
          taskId={taskId}
          rooms={rooms}
          editing={dialog.editing}
          dueAt={dueAt}
          data={data}
          open
          onOpenChange={(open) => (open ? null : setDialog(null))}
        />
      ) : null}
    </section>
  );
}
