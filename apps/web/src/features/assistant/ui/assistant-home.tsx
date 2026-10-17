import { AssistantBody } from "./assistant-body";

/**
 * The assistant as the home page (ADR 0035), and the only place it is shown. The session lives in
 * the shell, so a question asked from ⌘K elsewhere continues here. Fills the viewport below the
 * top bar.
 */
export function AssistantHome() {
  return (
    <section
      data-slot="assistant-home"
      className="mx-auto flex h-[calc(100dvh-5.5rem)] max-w-3xl flex-col overflow-hidden rounded-lg border sm:h-[calc(100dvh-6.5rem)]"
    >
      <AssistantBody />
    </section>
  );
}
