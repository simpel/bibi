import { SquarePenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { fieldLabel } from "../lib/field-label";
import { useFieldValue } from "./message-fields";
import { MessageHeader } from "./message-header";
import type { MessageViewProps } from "./message-view";

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="whitespace-pre-wrap break-words rounded-md border bg-background px-3 py-2 text-sm">
        {value}
      </div>
    </div>
  );
}

/** A web form submission as the filled-in form: each field read-only, the free text last. */
export function FormView({ message, received }: MessageViewProps) {
  const t = useTranslations("inbox");
  const show = useFieldValue();
  const contact = message.fromEmail ?? message.fromPhone ?? undefined;
  return (
    <article data-slot="form-view" className="overflow-hidden rounded-lg border bg-card">
      <MessageHeader
        icon={<SquarePenIcon />}
        sender={message.fromName ?? contact ?? t("unknownSender")}
        detail={[t("channels.WEB_FORM"), message.fromName ? contact : undefined]
          .filter(Boolean)
          .join(" · ")}
        received={received}
      />
      <div className="grid gap-4 px-5 py-5">
        {Object.entries(message.formFields ?? {}).map(([key, value]) => (
          <FormField key={key} label={fieldLabel({ key })} value={show(value)} />
        ))}
        {message.text ? <FormField label={t("form.message")} value={message.text} /> : null}
      </div>
    </article>
  );
}
