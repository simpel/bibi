import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { saveFloorPlanAction, saveSetupLayoutAction } from "../actions";
import { type DraftElement, toInput } from "../lib/draft";
import type { EditorRoom } from "./layout-editor";

export type UseEditorSaveInput = {
  itemId: string;
  layout: { id: string; name: string } | null;
  room: EditorRoom;
  elements: readonly DraftElement[];
  version: number;
  capacity: number | null;
};

/** Saves the open tab as a whole; the page renders again with what was stored. */
export function useEditorSave({
  itemId,
  layout,
  room,
  elements,
  version,
  capacity,
}: UseEditorSaveInput) {
  const t = useTranslations("floorPlan");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const pieces = elements.map((element) => toInput({ element }));
  const messages = { pending: common("saving"), success: t("saved") };
  const onSuccess = () => router.refresh();
  const save = () => {
    if (layout) {
      const input = {
        id: layout.id,
        name: layout.name,
        expectedVersion: version,
        capacity,
        elements: pieces,
      };
      run({ action: () => saveSetupLayoutAction({ input }), messages, onSuccess });
      return;
    }
    const input = {
      itemId,
      expectedVersion: version,
      widthCm: room.widthCm,
      depthCm: room.depthCm,
      outline: room.outline,
      minAisleCm: room.minAisleCm,
      elements: pieces,
    };
    run({ action: () => saveFloorPlanAction({ input }), messages, onSuccess });
  };
  return { save, pending };
}

export type EditorSave = ReturnType<typeof useEditorSave>;
