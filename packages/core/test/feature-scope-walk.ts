import type { z } from "zod";

type Def = { type: string } & Record<string, unknown>;

const defOf = ({ schema }: { schema: unknown }): Def | null => {
  const zod = (schema as { _zod?: { def?: Def } } | null)?._zod;
  return zod?.def ?? null;
};

/** Wrapper types whose one child sits in `innerType`. */
const WRAPPERS = [
  "optional",
  "nullable",
  "default",
  "prefault",
  "readonly",
  "nonoptional",
  "catch",
];

const childrenOf = ({ def }: { def: Def }): unknown[] => {
  if (def.type === "object") return [];
  if (def.type === "array") return [def.element];
  if (WRAPPERS.includes(def.type)) return [def.innerType];
  if (def.type === "union") return [...(def.options as unknown[])];
  if (def.type === "intersection") return [def.left, def.right];
  if (def.type === "record") return [def.valueType];
  if (def.type === "pipe") return [def.in, def.out];
  if (def.type === "lazy") return [(def.getter as () => unknown)()];
  return [];
};

export type KeysInput = { schema: z.ZodType };

/** Every object key in a Zod schema, recursively through objects, arrays and wrappers. */
export function outputKeys({ schema }: KeysInput): string[] {
  const keys = new Set<string>();
  const seen = new Set<unknown>();
  const walk = ({ node }: { node: unknown }) => {
    if (seen.has(node)) return;
    seen.add(node);
    const def = defOf({ schema: node });
    if (!def) return;
    if (def.type === "object") {
      for (const [key, child] of Object.entries(def.shape as Record<string, unknown>)) {
        keys.add(key);
        walk({ node: child });
      }
    }
    for (const child of childrenOf({ def })) walk({ node: child });
  };
  walk({ node: schema });
  return [...keys];
}
