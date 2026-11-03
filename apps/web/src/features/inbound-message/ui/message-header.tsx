import type { ReactNode } from "react";

export type MessageHeaderProps = {
  /** Who sent it, the main line. */
  sender: ReactNode;
  /** Under it: the address, number or how it came in. */
  detail?: ReactNode;
  icon?: ReactNode;
  /** When it came in, already formatted. */
  received: string;
};

/** The top of a message card: icon, who sent it and how, and when on the right. */
export function MessageHeader({ sender, detail, icon, received }: MessageHeaderProps) {
  return (
    <header className="flex items-start gap-3 border-b px-5 py-4">
      {icon ? (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4">
          {icon}
        </span>
      ) : null}
      <div className="grid min-w-0 flex-1 gap-0.5">
        <div className="truncate font-medium">{sender}</div>
        {detail ? <div className="truncate text-sm text-muted-foreground">{detail}</div> : null}
      </div>
      <time className="shrink-0 pt-0.5 text-xs text-muted-foreground">{received}</time>
    </header>
  );
}
