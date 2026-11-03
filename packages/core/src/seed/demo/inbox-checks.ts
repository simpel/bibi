import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

/**
 * The inbox (ADR 0085): both endpoints, the mailed request unread and the API request read in
 * the inbox, and the reply stored on its ticket with the old table's copy (expand phase).
 */
export async function checkDemoInbox({
  context,
  org,
}: {
  context: ExecuteContext;
  org: DemoOrg;
}): Promise<string[]> {
  const [endpoints, open, attached] = await Promise.all([
    context.db.inboundEndpoint.findMany({ select: { channel: true, address: true } }),
    context.db.inboundMessage.findMany({ where: { ticketId: null } }),
    context.db.inboundMessage.findMany({ where: { ticketId: { not: null } } }),
  ]);
  const failures: string[] = [];
  const email = endpoints.find((endpoint) => endpoint.channel === "EMAIL");
  if (email?.address !== org.slug) failures.push(`${org.slug}: no inbox address ${org.slug}`);
  if (!endpoints.some((endpoint) => endpoint.channel === "API")) {
    failures.push(`${org.slug}: no API endpoint`);
  }
  const channels = open.map((message) => message.channel).sort();
  if (channels.join() !== "API,EMAIL") {
    failures.push(`${org.slug}: inbox holds ${channels.join() || "nothing"}, expected API,EMAIL`);
  }
  const unread = open
    .filter((message) => message.readAt === null)
    .map((message) => message.channel);
  if (unread.join() !== "EMAIL") failures.push(`${org.slug}: expected only the mail unread`);
  const reply = attached[0];
  const legacy = reply ? await context.db.inboundEmail.count({ where: { id: reply.id } }) : 0;
  if (attached.length !== 1 || legacy !== 1) {
    failures.push(`${org.slug}: expected one reply on a ticket, also in InboundEmail`);
  }
  return failures;
}
