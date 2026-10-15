import { appError, err, ok } from "@okazi/core";
import type { MailProvider } from "./mail-provider";
import type { MailMessage } from "./schema";

export type MemoryMailProvider = { provider: MailProvider; outbox: MailMessage[] };

/** Captures sent mails in `outbox` instead of delivering them. For tests. */
export function createMemoryMailProvider(): MemoryMailProvider {
  const outbox: MailMessage[] = [];
  const provider: MailProvider = {
    name: "memory",
    async send({ message }) {
      outbox.push(message);
      return ok({ value: { providerMessageId: `memory-${outbox.length}` } });
    },
    async parseInbound() {
      const message = "Inbound mail is not supported by the memory provider";
      return err({ error: appError({ code: "UNAVAILABLE", message }) });
    },
  };
  return { provider, outbox };
}
