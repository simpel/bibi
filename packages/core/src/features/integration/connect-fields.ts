import { z } from "zod";
import type { ConnectPort } from "../../providers/connect-types";
import type { CredentialField } from "./schema";

type JsonProperty = {
  description?: string;
  format?: string;
  contentEncoding?: string;
  writeOnly?: boolean;
};

const SECRET_KEY = /pass|secret|key$/i;
const BASE64_TEXT = /\bbase64\b/i;

function kindOf({ key, property }: { key: string; property: JsonProperty }) {
  const base64 = [property.contentEncoding, property.format].includes("base64");
  if (base64 || BASE64_TEXT.test(property.description ?? "")) return "FILE";
  if (property.writeOnly || SECRET_KEY.test(key)) return "SECRET";
  return "TEXT";
}

/**
 * The fields a CREDENTIALS provider asks an admin for, read from its schema (ADR 0100), so a form
 * is drawn from data: base64 content is a FILE, a password-like key a SECRET, the rest TEXT.
 */
export function connectFieldsOf({ connect }: { connect: ConnectPort }): CredentialField[] {
  if (connect.kind !== "CREDENTIALS") return [];
  try {
    const json = z.toJSONSchema(connect.credentialsSchema, {
      io: "input",
      unrepresentable: "any",
    }) as { properties?: Record<string, JsonProperty> };
    return Object.entries(json.properties ?? {}).map(([key, property]) => ({
      key,
      kind: kindOf({ key, property }),
      description: property.description ?? null,
    }));
  } catch {
    return [];
  }
}
