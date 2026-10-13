import { type AppError, toMcpError } from "@okazi/core";
import type { ToolResult } from "./types";

export type ToJsonValueInput = { value: unknown };

/** Round-trips through JSON so dates become ISO strings and `undefined` disappears. */
export function toJsonValue({ value }: ToJsonValueInput): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export type SuccessResultInput = { value: unknown };

/** Structured result plus the same JSON as text for clients that ignore `structuredContent`. */
export function successResult({ value }: SuccessResultInput): ToolResult {
  const structuredContent = toJsonValue({ value });
  return { content: [{ type: "text", text: JSON.stringify(structuredContent) }], structuredContent };
}

export type ErrorResultInput = { error: AppError };

export function errorResult({ error }: ErrorResultInput): ToolResult {
  return toMcpError({ error });
}
