"use client";

import { Button, cn } from "@bibi/ui";
import { MaximizeIcon, MinimizeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

type Fullscreen = { on: boolean; toggle: () => void };

const FullscreenContext = createContext<Fullscreen>({ on: false, toggle: () => undefined });

/**
 * The whole day view, which can fill the screen: the browser's fullscreen where there is one, and
 * the view covering the app shell either way (dialogs and sheets stay above it).
 */
export function FullscreenFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [on, setOn] = useState(false);
  // Syncs with the browser: leaving fullscreen with Esc or a swipe also leaves this mode.
  useEffect(() => {
    const abort = new AbortController();
    document.addEventListener(
      "fullscreenchange",
      () => {
        if (!document.fullscreenElement) setOn(false);
      },
      { signal: abort.signal },
    );
    return () => abort.abort();
  }, []);
  const toggle = () => {
    const next = !on;
    setOn(next);
    if (next) document.documentElement.requestFullscreen?.().catch(() => undefined);
    else if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  };
  return (
    <FullscreenContext value={{ on, toggle }}>
      <div className={cn(className, on && "fixed inset-0 z-40 bg-background")}>{children}</div>
    </FullscreenContext>
  );
}

/** Enter or leave fullscreen: big, beside Create reservation. */
export function FullscreenButton() {
  const t = useTranslations("reservation");
  const { on, toggle } = useContext(FullscreenContext);
  return (
    <Button
      variant="outline"
      className="size-12 shrink-0"
      aria-label={on ? t("exitFullscreen") : t("enterFullscreen")}
      aria-pressed={on}
      onClick={toggle}
    >
      {on ? <MinimizeIcon className="size-5" /> : <MaximizeIcon className="size-5" />}
    </Button>
  );
}
