import { appError, err } from "@okazi/core";

export type InboundUnsupportedInput = { provider: string };

/** `UNAVAILABLE` for adapters without inbound mail (SMTP, memory). */
export const inboundUnsupported = ({ provider }: InboundUnsupportedInput) =>
  err({
    error: appError({
      code: "UNAVAILABLE",
      message: `Inbound mail is not supported by the ${provider} provider`,
    }),
  });
