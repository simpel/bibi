import { resolveLocale } from "@okazi/i18n";
import type { ReactNode } from "react";
import { redirectToPipelineSetup } from "@/features/pipeline-setup/needs-setup";

type CanvasLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/**
 * Full-width pages (ADR 0038): the calendar and the assistant home. They fill the viewport below
 * the top bar and decide for themselves which part is capped (a toolbar, the chat column). They
 * are where staff land, so an organization without phases is sent to the guided setup first.
 */
export default async function CanvasLayout({ children, params }: CanvasLayoutProps) {
  await redirectToPipelineSetup({ locale: resolveLocale({ value: (await params).locale }) });
  return <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col">{children}</div>;
}
