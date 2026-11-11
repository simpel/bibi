import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { saveFloorPlanAction, saveLayoutAction } from "../actions";
import { type DraftElement, toInput } from "../lib/draft";
import type { LayoutFacts } from "../lib/layout-facts";
import type { EditorRoom } from "./layout-editor";

export type UseEditorSaveInput = {
  itemId: string;
  layout: { id: string; facts: LayoutFacts } | null;
  room: EditorRoom;
  elements: readonly DraftElement[];
  version: number;
};

/** Saves the open tab as a whole; the page renders again with what was stored. */
export function useEditorSave({ itemId, layout, room, elements, version }: UseEditorSaveInput) {
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
        expectedVersion: version,
        ...layout.facts,
        elements: pieces,
      };
      run({ action: () => saveLayoutAction({ input }), messages, onSuccess });
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
