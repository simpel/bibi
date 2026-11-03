import type { DateTimeFormat } from "@bibi/core/schemas";
import { ApiView } from "./api-view";
import { EmailView } from "./email-view";
import { FormView } from "./form-view";
import type { InboundMessageValue } from "./message-value";
import { SmsView } from "./sms-view";

export type MessageViewProps = {
  message: InboundMessageValue;
  /** When it came in, formatted by the caller (server or client). */
  received: string;
};

const VIEWS = { EMAIL: EmailView, WEB_FORM: FormView, API: ApiView, SMS: SmsView } as const;

export type MessageViewInput = { message: InboundMessageValue; dates: DateTimeFormat };

/** When it came in, in the viewer's format. */
export const receivedText = ({ message, dates }: MessageViewInput) =>
  dates.dateTime({ instant: new Date(message.receivedAt) });

/**
 * One inbound message drawn the way its channel looks (ADR 0085): a mail as a mail, a web form
 * as the filled-in form, an API request as a request, a text as a chat bubble. Who sent it and
 * when show here once, so the sheet and the page around it do not repeat them.
 */
export function MessageView({ message, received }: MessageViewProps) {
  const View = VIEWS[message.channel];
  return <View message={message} received={received} />;
}
