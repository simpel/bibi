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

export type ToInboundEndpointDtoInput = { row: InboundEndpoint };

export function toInboundEndpointDto({ row }: ToInboundEndpointDtoInput): InboundEndpointDto {
  const { status: _status, createdBy: _createdBy, ...rest } = row;
  return { ...rest, address: endpointAddress({ row }) };
}
