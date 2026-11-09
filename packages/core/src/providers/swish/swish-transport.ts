import { request } from "node:https";

export type SwishHttpRequest = {
  method: "GET" | "PUT" | "PATCH";
  url: string;
  /** JSON body, already serialized. */
  body?: string;
  contentType?: string;
  /** The venue's client certificate (.p12) and its passphrase: Swish authenticates by mTLS. */
  pfx: Buffer;
  passphrase: string;
};

export type SwishHttpResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

/** One HTTPS call to Swish; rejects on a network or TLS failure. */
export type SwishTransport = (input: SwishHttpRequest) => Promise<SwishHttpResponse>;

const flatHeaders = ({ raw }: { raw: Record<string, string | string[] | undefined> }) =>
  Object.fromEntries(
    Object.entries(raw).flatMap(([key, value]) =>
      value === undefined
        ? []
        : [[key.toLowerCase(), Array.isArray(value) ? value.join(",") : value]],
    ),
  );

/**
 * Node's https with the connection's certificate per request (no shared agent, so one venue's
 * certificate never serves another's call). Swish's server CA is public, so the default trust
 * store verifies it.
 */
const httpsTransport: SwishTransport = ({ method, url, body, contentType, pfx, passphrase }) =>
  new Promise((resolve, reject) => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) {
      headers["Content-Type"] = contentType ?? "application/json";
      headers["Content-Length"] = String(Buffer.byteLength(body));
    }
    const req = request(url, { method, headers, pfx, passphrase, agent: false }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () =>
        resolve({
          status: res.statusCode ?? 0,
          headers: flatHeaders({ raw: res.headers }),
          body: Buffer.concat(chunks).toString("utf8"),
        }),
      );
      res.on("error", reject);
    });
    req.setTimeout(20_000, () => req.destroy(new Error("Swish timed out")));
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });

let current: SwishTransport = httpsTransport;

export const swishTransport = (): SwishTransport => current;

export type SetSwishTransportInput = { transport: SwishTransport | undefined };

/** Tests answer Swish calls with a stub; `undefined` restores the real HTTPS transport. */
export function setSwishTransport({ transport }: SetSwishTransportInput): void {
  current = transport ?? httpsTransport;
}
