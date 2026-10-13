export type MessageTree = { [key: string]: string | MessageTree };

type FlattenInput = { tree: MessageTree; prefix?: string };
type DiffInput = { base: MessageTree; other: MessageTree };

export type MessageDiff = {
  /** Keys present in `base` but missing in `other`. */
  missingInOther: string[];
  /** Keys present in `other` but missing in `base`. */
  extraInOther: string[];
};

/** Flatten a nested message tree into sorted dot-separated keys. */
export function flattenKeys({ tree, prefix = "" }: FlattenInput): string[] {
  const keys = Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : flattenKeys({ tree: value, prefix: path });
  });
  return keys.sort();
}

/** Compare the key sets of two message trees. */
export function diffMessageKeys({ base, other }: DiffInput): MessageDiff {
  const baseKeys = flattenKeys({ tree: base });
  const otherKeys = new Set(flattenKeys({ tree: other }));
  const baseSet = new Set(baseKeys);
  return {
    missingInOther: baseKeys.filter((key) => !otherKeys.has(key)),
    extraInOther: [...otherKeys].filter((key) => !baseSet.has(key)).sort(),
  };
}

/** True when both trees have exactly the same keys. */
export function hasKeyParity({ base, other }: DiffInput): boolean {
  const diff = diffMessageKeys({ base, other });
  return diff.missingInOther.length === 0 && diff.extraInOther.length === 0;
}
