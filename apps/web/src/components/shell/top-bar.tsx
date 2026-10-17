import { AssistantToggle } from "@/features/assistant/ui/assistant-toggle";
import { CommandBar } from "./command-bar";
import { MobileNav, type MobileNavProps } from "./mobile-nav";

export type TopBarProps = MobileNavProps;

/** Mobile menu, ⌘K command bar and the assistant toggle; the account lives in the sidebar. */
export function TopBar(props: TopBarProps) {
  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
      <MobileNav {...props} />
      <div className="flex flex-1 items-center">
        <CommandBar />
      </div>
      <AssistantToggle />
    </header>
  );
}
