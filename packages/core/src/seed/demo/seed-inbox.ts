import { ok, type Result } from "../../errors/result";
import { toReceiveInput } from "../../features/inbound-email/to-receive-input";
import { receiveInboundMessage } from "../../features/inbound-message/receive-operation";
import {
  markInboundMessageRead,
  submitInboundMessage,
} from "../../features/inbound-message/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

const HOUR_MS = 3_600_000;

type MailInput = {
  slug: string;
  key: string;
  from: string;
  subject: string;
  text: string;
  hoursAgo: number;
};

/** A received mail as the EMAIL adapter hands it over (ADR 0085); the route is added later. */
const mail = ({ slug, key, from, subject, text, hoursAgo }: MailInput) =>
  toReceiveInput({
    mail: {
      providerEmailId: `demo_${slug}_${key}`,
      messageId: `<${key}@${slug}.bibi.test>`,
      fromAddress: from,
      toAddresses: [`${slug}@in.bibi.test`],
      subject,
      text,
      html: null,
      attachments: [],
      receivedAt: new Date(Date.now() - hoursAgo * HOUR_MS),
    },
  });

type SeedInboxInput = { context: ExecuteContext; org: DemoOrg };

type Endpoints = { emailId: string | null; orderId: string | null; slug: string };

/** A booking request mailed to the organization address, and a reply on the first order. */
const mails = ({ emailId, orderId, slug }: Endpoints) => [
  {
    ...mail({
      ...{ slug, key: "tasting", hoursAgo: 5, from: "Linnea Kvist <linnea.kvist@kvarnby.test>" },
      subject: "Wine tasting for 14 on 21 November",
      // The text the E2E draft model (`packages/ai/src/extract/e2e-draft-model.ts`) is written for.
      text: "Hi! A wine tasting for 14 people on Friday 21 November, around 3 pm. Two of us are vegan. Best, Linnea",
    }),
    endpointId: emailId,
    orderId: null,
  },
  {
    ...mail({
      ...{ slug, key: "reply", hoursAgo: 30, from: "Guest <guest@example.test>" },
      subject: "Re: your booking",
      text: "Thanks! We will be two more, and one guest is vegetarian.",
    }),
    endpointId: null,
    orderId,
  },
];

const PARTNER_REQUEST = {
  subject: "Team day for 30",
  text: "Partner request: a team day for 30 guests next month, a meeting room and lunch.",
  formFields: { guests: 30, lunch: true },
};

/**
 * The inbox (ADR 0085, `docs/demo-seed.md`): a booking request mailed to the organization address,
 * a customer reply on the first order, and a request a partner system handed in over the API.
 * The partner request is read, so the inbox shows both its unread and its read table.
 */
export async function seedDemoInbox({ context, org }: SeedInboxInput): Promise<Result<true>> {
  const [endpoints, order] = await Promise.all([
    context.db.inboundEndpoint.findMany({}),
    context.db.order.findFirst({ orderBy: { reference: "asc" } }),
  ]);
  const emailId = endpoints.find((endpoint) => endpoint.channel === "EMAIL")?.id ?? null;
  const api = endpoints.find((endpoint) => endpoint.channel === "API");
  for (const input of mails({ emailId, orderId: order?.id ?? null, slug: org.slug })) {
    const stored = await execute({ operation: receiveInboundMessage, input, context });
    if (!stored.ok) return stored;
  }
  if (!api) return ok({ value: true });
  const input = { endpointId: api.id, ...PARTNER_REQUEST };
  const submitted = await execute({ operation: submitInboundMessage, input, context });
  if (!submitted.ok) return submitted;
  const read = { id: submitted.value.id };
  const marked = await execute({ operation: markInboundMessageRead, input: read, context });
  return marked.ok ? ok({ value: true }) : marked;
}
