"use client";

import type { RoomCreateInput, RoomDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useFormAction } from "@/lib/use-form-action";
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
  const save = ({ values }: { values: RoomCreateInput }) => {
    const { venueId: _venueId, ...fields } = values;
    return room
      ? updateRoomAction({ input: { id: room.id, ...fields } })
      : createRoomAction({ input: values });
  };
  const { submit, pending } = useFormAction({
    form,
    action: save,
    messages: { pending: common("saving"), success: t(room ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
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
    </Form>
  );
}
