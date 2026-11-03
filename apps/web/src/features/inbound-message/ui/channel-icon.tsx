import type { InboundChannel } from "@bibi/core/schemas";
import { MailIcon, MessageSquareIcon, PlugIcon, SquarePenIcon } from "lucide-react";

const ICONS = {
  EMAIL: MailIcon,
  WEB_FORM: SquarePenIcon,
  SMS: MessageSquareIcon,
  API: PlugIcon,
} as const satisfies Record<InboundChannel, unknown>;

/** The channel's icon in an inbox row; its name is in the row's channel column. */
export function ChannelIcon({ channel }: { channel: InboundChannel }) {
  const Icon = ICONS[channel];
  return <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />;
}
