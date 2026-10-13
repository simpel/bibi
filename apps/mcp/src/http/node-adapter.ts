import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

export type ToWebRequestInput = { req: IncomingMessage; baseUrl: string };

/** Node `IncomingMessage` -> Web `Request` (body streamed for non-GET/HEAD). */
export function toWebRequest({ req, baseUrl }: ToWebRequestInput): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) for (const item of value) headers.append(name, item);
    else if (value !== undefined) headers.set(name, value);
  }
  const method = req.method ?? "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  return new Request(new URL(req.url ?? "/", baseUrl), {
    method,
    headers,
    ...(hasBody ? { body: Readable.toWeb(req) as ReadableStream, duplex: "half" } : {}),
  } as RequestInit);
}

export type SendWebResponseInput = { res: ServerResponse; response: Response };

/** Web `Response` -> Node response; streams the body so SSE also works. */
export async function sendWebResponse({ res, response }: SendWebResponseInput): Promise<void> {
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (!response.body) return void res.end();
  for await (const chunk of response.body) res.write(chunk);
  res.end();
}
