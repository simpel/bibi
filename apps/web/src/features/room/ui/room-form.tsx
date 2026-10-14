"use client";

import type { RoomCreateInput, RoomDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, DialogFooter, toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ErrorBanner } from "@/components/states/error-banner";
import { useActionSubmit } from "@/lib/use-action-submit";
import { createRoomAction, updateRoomAction } from "../actions";
import { RoomFormFields } from "./room-form-fields";
import { useRoomForm } from "./use-room-form";

export type RoomFormProps = {
  venueId: string;
  /** Present = edit mode, absent = create mode. */
  room?: RoomDto | undefined;
  onDone: () => void;
};

export function RoomForm({ venueId, room, onDone }: RoomFormProps) {
  const t = useTranslations("room");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useRoomForm({ venueId, room });
  const { pending, errorKey, run } = useActionSubmit<RoomDto>({
    onSuccess: () => {
      toast.success(t(room ? "updated" : "created"));
      router.refresh();
      onDone();
    },
  });
  const save = ({ values }: { values: RoomCreateInput }) => {
    const { venueId: _venueId, ...fields } = values;
    return room
      ? updateRoomAction({ input: { id: room.id, ...fields } })
      : createRoomAction({ input: values });
  };
  const onSubmit = form.handleSubmit((values) => run({ action: () => save({ values }) }));
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <ErrorBanner errorKey={errorKey} />
      <RoomFormFields form={form} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {common("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {common("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
