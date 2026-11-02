import { MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { inboxMessageRoute } from "@/lib/inbox-routes";
import { Link } from "@/lib/navigation";
import type { IntakeMessage } from "./intake-message";

/** "From <sender>'s message": the ticket will be attached to it on Create. */
export function MessageBanner({ message }: { message: IntakeMessage }) {
  const t = useTranslations("ticketIntake");
  return (
    <p className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
      <MailIcon className="size-4 text-muted-foreground" aria-hidden />
      <Link href={inboxMessageRoute({ id: message.id })} className="hover:underline">
        {t("fromMessage", { sender: message.sender })}
      </Link>
    </p>
  );
}
