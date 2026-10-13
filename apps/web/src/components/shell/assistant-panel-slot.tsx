/**
 * EXTENSION POINT for the AI phase (ADR 0007). The assistant panel (chat, approval cards,
 * generative UI) mounts here, on every page of the app shell. Intentionally empty in this
 * phase: no LLM, no placeholder UI. The AI phase may turn this into a client component that
 * reads the page context (active organization, route, entity).
 */
export function AssistantPanelSlot() {
  return <div data-slot="assistant-panel-slot" className="contents" />;
}
