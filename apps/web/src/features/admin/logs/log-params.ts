import { SystemLogListInputSchema, type SystemLogListQuery } from "@bibi/core/schemas";

/** URL search params of `/admin/logs`; the URL is the single source of the view state. */
export type LogSearchParams = Record<string, string | string[] | undefined>;

export const LOG_PARAM_KEYS = ["page", "pageSize", "level", "q", "requestId", "surface"] as const;

export type LogParamKey = (typeof LOG_PARAM_KEYS)[number];

export type ParsedLogParams = { query: SystemLogListQuery; selected: string | null };

const first = ({ value }: { value: string | string[] | undefined }): string | undefined =>
  Array.isArray(value) ? value[0] : value || undefined;

export type ParseLogParamsInput = { params: LogSearchParams };

/** Invalid values fall back to defaults instead of erroring (hand-edited URLs). */
export function parseLogParams({ params }: ParseLogParamsInput): ParsedLogParams {
  const raw = Object.fromEntries(
    LOG_PARAM_KEYS.map((key) => [key, first({ value: params[key] })]).filter(([, v]) => v),
  );
  const parsed = SystemLogListInputSchema.safeParse(raw);
  const query = parsed.success ? parsed.data : SystemLogListInputSchema.parse({});
  return { query, selected: first({ value: params.log }) ?? null };
}

export type LogHrefInput = {
  current: URLSearchParams;
  patch: Partial<Record<LogParamKey | "log", string | null>>;
};

/** `?…` for the patched state; filter changes go back to page 1. */
export function logQueryString({ current, patch }: LogHrefInput): string {
  const next = new URLSearchParams(current);
  const filterChanged = Object.keys(patch).some((key) => key !== "page" && key !== "log");
  if (filterChanged && !("page" in patch)) next.delete("page");
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  return query ? `?${query}` : "";
}
