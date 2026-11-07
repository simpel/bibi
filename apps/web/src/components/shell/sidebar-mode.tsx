"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { isActive } from "./sidebar-link";

export type SidebarModeProps = {
  /** What shows inside the administration area (`/admin/*`). */
  admin: ReactNode;
  /** What shows everywhere else. */
  children: ReactNode;
};

/** Swaps a part of the sidebar while the member is in the administration area (ADR 0036). */
export function SidebarMode({ admin, children }: SidebarModeProps) {
  const pathname = usePathname();
  return isActive({ pathname, href: ROUTES.admin }) ? admin : children;
}
