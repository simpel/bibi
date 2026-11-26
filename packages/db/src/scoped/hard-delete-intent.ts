import { ORG_SCOPED_MODELS } from "./models";
import { SOFT_DELETE_MODELS } from "./soft-delete-models";

/**
 * How a hard delete of a soft-deleted model declares itself (ADR 0118). Archiving is the delete
 * for these models (ADR 0006), so `scopedDb` refuses `delete`/`deleteMany` on them unless the
 * query carries this key. It travels as data, like the record intent, and the scope hook strips
 * it. Only `withHardDelete` sets it, and only core's `archive/` (deleting archived records and
 * the rows that mean nothing without them) calls that.
 */
export const HARD_DELETE_KEY = "$hardDelete";

const DELETE_METHODS = ["delete", "deleteMany"] as const;

type Args = Record<string, unknown>;
type Delegate = Record<string, unknown>;

const delegateKey = ({ model }: { model: string }) =>
  model.charAt(0).toLowerCase() + model.slice(1);

/** The delegate's delete methods, each marking its query as a declared hard delete. */
function deletingDelegate({ delegate }: { delegate: Delegate }) {
  const view: Record<string, unknown> = {};
  for (const method of DELETE_METHODS) {
    const query = delegate[method];
    if (typeof query !== "function") continue;
    view[method] = (args?: Args) =>
      query.call(delegate, { ...(args ?? {}), [HARD_DELETE_KEY]: true });
  }
  return view;
}

/** A soft-deleted model's delegate with only `delete` and `deleteMany`. */
export type HardDeleteDelegate<D> = D extends { delete: infer A; deleteMany: infer B }
  ? { delete: A; deleteMany: B }
  : never;

/** A view of a scoped client (or transaction client) with the soft-deleted models' delete methods. */
export type HardDeleteClient<Client> = {
  [K in keyof Client]: HardDeleteDelegate<Client[K]>;
};

export type WithHardDeleteInput<Client extends object> = { client: Client };

/**
 * A view of a scoped client whose soft-deleted models may be hard deleted (ADR 0118). It has
 * only their `delete` and `deleteMany`; everything else stays on the client itself.
 */
export function withHardDelete<Client extends object>({
  client,
}: WithHardDeleteInput<Client>): HardDeleteClient<Client> {
  const view = {};
  const source = client as unknown as Record<string, Delegate>;
  for (const model of ORG_SCOPED_MODELS) {
    if (!SOFT_DELETE_MODELS.has(model)) continue;
    const key = delegateKey({ model });
    Object.defineProperty(view, key, {
      enumerable: true,
      get: () => deletingDelegate({ delegate: source[key] as Delegate }),
    });
  }
  return view as HardDeleteClient<Client>;
}

/** Strips the key and says whether the query declared a hard delete. */
export function readHardDelete({ args }: { args: Args }): { args: Args; declared: boolean } {
  const { [HARD_DELETE_KEY]: declared, ...rest } = args;
  return { args: rest, declared: declared === true };
}
