import { Breadcrumb } from "./breadcrumb";
import { CommandBar } from "./command-bar";
import { MobileNav, type MobileNavProps } from "./mobile-nav";

export type TopBarProps = MobileNavProps;

/** Mobile menu and breadcrumb on the left, the ⌘K command bar on the right. */
export function TopBar(props: TopBarProps) {
  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
      <MobileNav {...props} />
      <div className="flex min-w-0 flex-1 items-center">
        <Breadcrumb />
      </div>
      <CommandBar permissions={props.access.permissions} />
    </header>
  );
}
