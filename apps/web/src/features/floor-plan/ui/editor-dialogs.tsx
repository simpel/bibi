import { useTranslations } from "next-intl";
import type { EditorRoom } from "./layout-editor";
import { NumbersDialog } from "./numbers-dialog";

export type EditorDialog = "capacity" | "room" | null;

export type EditorDialogsProps = {
  dialog: EditorDialog;
  setDialog: (dialog: EditorDialog) => void;
  capacity: number | null;
  seats: number;
  room: EditorRoom;
  setCapacity: (capacity: number | null) => void;
  setRoom: (room: EditorRoom) => void;
};

/** The typed capacity and the room's size; both are stored with the next Save. */
export function EditorDialogs({
  dialog,
  setDialog,
  capacity,
  seats,
  room,
  setCapacity,
  setRoom,
}: EditorDialogsProps) {
  const t = useTranslations("floorPlan");
  return (
    <>
      <NumbersDialog
        open={dialog === "capacity"}
        onOpenChange={(open) => (open ? null : setDialog(null))}
        title={t("capacityDialog.title")}
        description={t("capacityDialog.description", { seats })}
        confirmLabel={t("capacityDialog.confirm")}
        fields={[
          {
            key: "capacity",
            label: t("capacityDialog.field"),
            value: capacity ?? seats,
            min: 1,
            max: 100_000,
          },
        ]}
        onConfirm={(values) => setCapacity(values.capacity ?? null)}
      />
      <NumbersDialog
        open={dialog === "room"}
        onOpenChange={(open) => (open ? null : setDialog(null))}
        title={t("roomDialog.title")}
        description={t("roomDialog.description")}
        confirmLabel={t("roomDialog.confirm")}
        fields={[
          {
            key: "width",
            label: t("roomDialog.width"),
            value: room.widthCm / 100,
            min: 1,
            max: 200,
          },
          {
            key: "depth",
            label: t("roomDialog.depth"),
            value: room.depthCm / 100,
            min: 1,
            max: 200,
          },
        ]}
        onConfirm={(values) => {
          const widthCm = (values.width ?? 10) * 100;
          const depthCm = (values.depth ?? 8) * 100;
          const outline: [number, number][] = [
            [0, 0],
            [widthCm, 0],
            [widthCm, depthCm],
            [0, depthCm],
          ];
          setRoom({ ...room, widthCm, depthCm, outline });
        }}
      />
    </>
  );
}
