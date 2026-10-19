import { OnboardingChat } from "./onboarding-chat";
import { OnboardingPanel } from "./onboarding-panel";

/** Split layout: the conversation left, a slot for the first version right. */
export function OnboardingPage() {
  return (
    <div className="grid h-full md:grid-cols-2">
      <section className="flex min-h-0 flex-col border-r">
        <OnboardingChat />
      </section>
      <aside className="hidden min-h-0 overflow-y-auto bg-muted/40 md:block">
        <OnboardingPanel />
      </aside>
    </div>
  );
}
