import "server-only";
import { getOrderTemplate, type OrderTemplateDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadOrderTemplateCached = cache(async (id: string): Promise<Result<OrderTemplateDto>> => {
  return runOperation({ operation: getOrderTemplate, input: { id } });
});

export type LoadOrderTemplateInput = { id: string };

/** The order template by its id, cached per request so metadata and page components share one read. */
export function loadOrderTemplate({
  id,
}: LoadOrderTemplateInput): Promise<Result<OrderTemplateDto>> {
  return loadOrderTemplateCached(id);
}
