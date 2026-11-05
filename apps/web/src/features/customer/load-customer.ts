import "server-only";
import { type CustomerDto, getCustomer, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadCustomerCached = cache(async (id: string): Promise<Result<CustomerDto>> => {
  return runOperation({ operation: getCustomer, input: { id } });
});

export type LoadCustomerInput = { id: string };

/** The customer by its id, cached per request so metadata and page components share one read. */
export function loadCustomer({ id }: LoadCustomerInput): Promise<Result<CustomerDto>> {
  return loadCustomerCached(id);
}
