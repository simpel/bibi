import "server-only";
import { type ItemDto, listItems, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "./run-operation";

/** The catalog's first page of items for pickers, read once per request (ADR 0097 §3). */
export const loadPickerItems = cache(
  (): Promise<Result<{ items: ItemDto[]; nextCursor: string | null }>> =>
    runOperation({ operation: listItems, input: { limit: 100 } }),
);
