import { PageContainer } from "@okazi/ui";
import type { ReactNode } from "react";

/** Lists, details, forms and settings: centred content (ADR 0038). Pages pick a narrower or wider tier themselves. */
export default function ContainedLayout({ children }: { children: ReactNode }) {
  return <PageContainer>{children}</PageContainer>;
}
