import { AppError } from "../../errors/app-error";
import { err, type Result } from "../../errors/result";
import { type BillingKeys, loadBillingKeys } from "./billing-config";

export type WithBillingKeysInput<T> = { run: (keys: BillingKeys) => Promise<Result<T>> };

/** Runs one Stripe step with Bibi's billing keys; `UNAVAILABLE` while billing is not set up. */
export async function withBillingKeys<T>({ run }: WithBillingKeysInput<T>): Promise<Result<T>> {
  const keys = await loadBillingKeys();
  if (!keys.ok) return err({ error: keys.error });
  if (!keys.value) {
    const message =
      "Bibi billing is not configured (a superadmin sets it up in /mothership/billing).";
    return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
  }
  return run(keys.value);
}
