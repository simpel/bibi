import { Link } from "@okazi/i18n/navigation";
import { cn } from "@okazi/ui";
import type { LucideIcon } from "lucide-react";

export type SidebarLinkProps = { href: string; label: string; icon: LucideIcon; active: boolean };

/** One sidebar row; `aria-current` marks the page the user is on. */
export function SidebarLink({ href, label, icon: Icon, active }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    >
      <Icon className="size-4" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export type IsActiveInput = { pathname: string; href: string };

export function isActive({ pathname, href }: IsActiveInput): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
