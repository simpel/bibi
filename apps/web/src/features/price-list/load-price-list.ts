import "server-only";
import { getPriceList, type PriceListDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadPriceListCached = cache(async (id: string): Promise<Result<PriceListDto>> => {
  return runOperation({ operation: getPriceList, input: { id } });
});

export type LoadPriceListInput = { id: string };

/** The price list by its id, cached per request so metadata and page components share one read. */
export function loadPriceList({ id }: LoadPriceListInput): Promise<Result<PriceListDto>> {
  return loadPriceListCached(id);
}
