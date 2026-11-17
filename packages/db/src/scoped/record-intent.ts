import { ORG_SCOPED_MODELS } from "./models";

/**
 * How a query declares its record intent (ADR 0113). Prisma copies query arguments before an
 * extension sees them, so the intent travels as data under one private key that the scope hook
 * reads and strips before Prisma validates the query. Only `withRecordIntent` sets it.
 */
export const RECORD_INTENT_KEY = "$recordIntent";

/** Why an engine read sees every row, even for a caller who sees only related records. */
export const ENGINE_PURPOSES = [
  "capacity",
  "integrity",
  "configuration",
  "derivation",
  "system",
] as const;
export type EnginePurpose = (typeof ENGINE_PURPOSES)[number];

/** The caller's filter per record-scoped model; `null` when the caller sees every record. */
export type RecordPredicates = Readonly<Record<string, Readonly<Record<string, unknown>> | null>>;

export type RecordIntent =
  | { readonly kind: "records"; readonly predicates: RecordPredicates }
  | { readonly kind: "engine"; readonly purpose: EnginePurpose };

/** Every query method of a Prisma model delegate. */
const MODEL_METHODS = [
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
] as const;

type Args = Record<string, unknown>;
type Delegate = Record<string, unknown>;

/** A model delegate whose every query carries the intent. */
function delegateWithIntent({ delegate, intent }: { delegate: Delegate; intent: RecordIntent }) {
  const view: Record<string, unknown> = {};
  for (const method of MODEL_METHODS) {
    const query = delegate[method];
    if (typeof query !== "function") continue;
    view[method] = (args?: Args) =>
      query.call(delegate, { ...(args ?? {}), [RECORD_INTENT_KEY]: intent });
  }
  return view;
}

const delegateKey = ({ model }: { model: string }) =>
  model.charAt(0).toLowerCase() + model.slice(1);

export type WithRecordIntentInput<Client extends object> = { client: Client; intent: RecordIntent };

/**
 * A view of a scoped client, or of a transaction client, whose model queries declare `intent`.
 * It has the model delegates only: transactions and raw helpers stay on the client itself.
 */
export function withRecordIntent<Client extends object>({
  client,
  intent,
}: WithRecordIntentInput<Client>): Client {
  const view = {};
  const source = client as unknown as Record<string, Delegate>;
  for (const model of ORG_SCOPED_MODELS) {
    const key = delegateKey({ model });
    Object.defineProperty(view, key, {
      enumerable: true,
      get: () => delegateWithIntent({ delegate: source[key] as Delegate, intent }),
    });
  }
  return view as Client;
}
