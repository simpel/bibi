import { getEnv } from "@bibi/config";
import type { InboundEndpoint } from "@bibi/db";
import type { InboundEndpointDto } from "./endpoint-schema";

export type EndpointAddressInput = { row: Pick<InboundEndpoint, "channel" | "address"> };

/** The full address: the EMAIL local part on `MAIL_INBOUND_DOMAIN`, else the stored address. */
export function endpointAddress({ row }: EndpointAddressInput): string | null {
  if (row.channel !== "EMAIL" || !row.address) return row.address;
  const domain = getEnv().MAIL_INBOUND_DOMAIN;
  return domain ? `${row.address}@${domain.toLowerCase()}` : null;
}

export type ToInboundEndpointDtoInput = {
  row: InboundEndpoint;
  /** When its newest message arrived (derived); null when none has, or not looked up. */
  lastReceivedAt?: Date | null;
};

export function toInboundEndpointDto({
  row,
  lastReceivedAt = null,
}: ToInboundEndpointDtoInput): InboundEndpointDto {
  const { status: _status, createdBy: _createdBy, ...rest } = row;
  const localPart = row.channel === "EMAIL" ? row.address : null;
  return { ...rest, address: endpointAddress({ row }), localPart, lastReceivedAt };
}
