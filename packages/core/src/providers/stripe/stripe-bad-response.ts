import { AppError } from "../../errors/app-error";
import { err } from "../../errors/result";

export type BadResponseInput = { what: string };

/** Stripe answered 2xx with a body we cannot read. */
export const stripeBadResponse = ({ what }: BadResponseInput) =>
  err({
    error: new AppError({ code: "INTERNAL", message: `Unexpected Stripe ${what} response.` }),
  });
