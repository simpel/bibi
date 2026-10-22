import { type AppError, appError, err, ok, type Result } from "@bibi/core";
import type { CompiledRoute } from "./compile-routes";

export type BuildInputInput = {
  compiled: CompiledRoute;
  params: Record<string, string>;
  url: URL;
  request: Request;
};

type QueryInput = { searchParams: URLSearchParams; kinds: CompiledRoute["kinds"] };
type BodyInput = { request: Request };
type AsNumberInput = { raw: string };

function asNumber({ raw }: AsNumberInput): string | number {
  const value = Number(raw);
  return raw.trim() === "" || Number.isNaN(value) ? raw : value;
}

/** Query strings are untyped; coerce by the operation's input schema, Zod validates after. */
function readQuery({ searchParams, kinds }: QueryInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(searchParams.keys())) {
    const kind = kinds[key];
    const raw = searchParams.get(key) ?? "";
    if (kind === "array") out[key] = searchParams.getAll(key);
    else if (kind === "number") out[key] = asNumber({ raw });
    else if (kind === "boolean") out[key] = raw === "true" ? true : raw === "false" ? false : raw;
    else out[key] = raw;
  }
  return out;
}

type InvalidInput = { message: string };

function invalid({ message }: InvalidInput): Result<never, AppError> {
  return err({ error: appError({ code: "VALIDATION", message }) });
}

async function readBody({ request }: BodyInput): Promise<Result<Record<string, unknown>>> {
  const text = await request.text();
  if (text.trim() === "") return ok({ value: {} });
  try {
    const json: unknown = JSON.parse(text);
    if (json === null || typeof json !== "object" || Array.isArray(json)) {
      return invalid({ message: "Request body must be a JSON object" });
    }
    return ok({ value: json as Record<string, unknown> });
  } catch {
    return invalid({ message: "Request body is not valid JSON" });
  }
}

/** Merges query/body and path params into one operation input; path params always win. */
export async function buildInput({
  compiled,
  params,
  url,
  request,
}: BuildInputInput): Promise<Result<Record<string, unknown>>> {
  const { method } = compiled.route;
  const hasBody = method === "POST" || method === "PATCH" || method === "PUT";
  const query = readQuery({ searchParams: url.searchParams, kinds: compiled.kinds });
  if (!hasBody) return ok({ value: { ...query, ...params } });
  const body = await readBody({ request });
  return body.ok ? ok({ value: { ...query, ...body.value, ...params } }) : body;
}
