import { CommandBar } from "./command-bar";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export type TopBarProps = { organizationId: string; user: { name: string; email: string } };

export function TopBar({ organizationId, user }: TopBarProps) {
  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
      <MobileNav organizationId={organizationId} />
      <div className="flex flex-1 items-center">
        <CommandBar />
      </div>
      <LocaleSwitcher />
      <ThemeToggle />
      <UserMenu name={user.name} email={user.email} />
    </header>
  );
}
