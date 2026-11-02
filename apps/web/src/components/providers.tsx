"use client";

import { AppLinkProvider, ContactLabelsProvider, Toaster, TooltipProvider } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ThemeProvider, useTheme } from "next-themes";
import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";

function AppToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme === "dark" ? "dark" : "light"} position="top-center" />;
}

/** The words on every person's contact card, from the app's translations. */
function ContactLabels({ children }: { children: ReactNode }) {
  const t = useTranslations("contact.card");
  return (
    <ContactLabelsProvider
      labels={{
        ...{ phone: t("phone"), email: t("email"), copyFailed: t("copyFailed") },
        copy: ({ label }) => t("copy", { label: label.toLowerCase() }),
        copied: ({ label }) => t("copied", { label }),
      }}
    >
      {children}
    </ContactLabelsProvider>
  );
}

export type ProvidersProps = { children: ReactNode };

/**
 * Client-side providers: dark-class theming (next-themes), tooltips, toasts, contact words and the
 * scoped link that `@bibi/ui` links to app pages with.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <AppLinkProvider link={Link}>
          <ContactLabels>{children}</ContactLabels>
        </AppLinkProvider>
        <AppToaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
