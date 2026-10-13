"use client";

import { Toaster, TooltipProvider } from "@okazi/ui";
import { ThemeProvider, useTheme } from "next-themes";
import type { ReactNode } from "react";

function AppToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} position="bottom-right" />;
}

export type ProvidersProps = { children: ReactNode };

/** Client-side providers: dark-class theming (next-themes), tooltips, toasts. */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        {children}
        <AppToaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
