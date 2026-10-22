import { ok } from "@bibi/core";
import { inboundUnsupported } from "./inbound-unsupported";
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
      return inboundUnsupported({ provider: "memory" });
    },
    async fetchInbound() {
      return inboundUnsupported({ provider: "memory" });
    },
  };
  return { provider, outbox };
}
