"use client";

import { useTranslations } from "next-intl";
import { useAssistant } from "../state/assistant-context";
import { AssistantBody } from "./assistant-body";
import { ResizeHandle } from "./resize-handle";

/** Desktop: the panel docked to the right edge, resizable, next to the page content. */
export function AssistantDock() {
  const t = useTranslations("assistant");
  const { width, setWidth } = useAssistant();
  return (
    <aside
      data-slot="assistant-panel"
      aria-label={t("title")}
      style={{ width }}
      className="sticky top-0 hidden h-screen shrink-0 border-l md:block"
    >
      <ResizeHandle width={width} onResize={setWidth} />
      <AssistantBody showClose />
    </aside>
  );
}
