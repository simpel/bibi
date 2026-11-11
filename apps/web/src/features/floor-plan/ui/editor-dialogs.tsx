import { isSimpleOutline } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { type Outline, rectangle, scaleOutline } from "../lib/outline-edit";
import type { EditorRoom } from "./layout-editor";
import { NumbersDialog } from "./numbers-dialog";

export type EditorDialog = "room" | null;

export type EditorDialogsProps = {
  dialog: EditorDialog;
  setDialog: (dialog: EditorDialog) => void;
  room: EditorRoom;
  setOutline: (outline: Outline) => void;
};

/** The room's size; stored with the next Save. */
export function EditorDialogs({ dialog, setDialog, room, setOutline }: EditorDialogsProps) {
  const t = useTranslations("floorPlan");
  return (
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
        const widthCm = Math.round((values.width ?? 10) * 100);
        const depthCm = Math.round((values.depth ?? 8) * 100);
        // The same shape stretched; a rectangle if rounding would make its walls cross.
        const scaled = scaleOutline({ outline: room.outline, widthCm, depthCm });
        setOutline(isSimpleOutline({ outline: scaled }) ? scaled : rectangle({ widthCm, depthCm }));
      }}
    />
  );
}
