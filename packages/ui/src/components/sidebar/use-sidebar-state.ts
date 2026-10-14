import { useCallback, useState } from "react";
import { useSidebarShortcut } from "./use-sidebar-shortcut";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type PersistOpenInput = { open: boolean };

function persistOpen({ open }: PersistOpenInput) {
  // biome-ignore lint/suspicious/noDocumentCookie: sidebar state cookie is read server-side by the app
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
}

export type UseSidebarStateInput = {
  defaultOpen: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isMobile: boolean;
};

export function useSidebarState({
  defaultOpen,
  open: openProp,
  onOpenChange,
  isMobile,
}: UseSidebarStateInput) {
  const [openMobile, setOpenMobile] = useState(false);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;

  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const next = typeof value === "function" ? value(open) : value;
      if (onOpenChange) onOpenChange(next);
      else setInternalOpen(next);
      persistOpen({ open: next });
    },
    [onOpenChange, open],
  );

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile((value) => !value);
    else setOpen((value) => !value);
  }, [isMobile, setOpen]);

  useSidebarShortcut({ onToggle: toggleSidebar });

  return { open, setOpen, openMobile, setOpenMobile, toggleSidebar };
}
