import { ChatView } from "./chat-view";

/**
 * The assistant as the home page (ADR 0035). The session lives in the shell, so a question asked
 * from ⌘K elsewhere continues here. A full page: it fills the viewport below the top bar (the
 * shell drops its padding and width cap for it).
 */
export function AssistantHome() {
  return (
    <section data-slot="assistant-home" className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <ChatView />
    </section>
  );
}
