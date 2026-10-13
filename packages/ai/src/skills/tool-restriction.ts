export type ToolRestriction = {
  /** Tools the model may use now; `null` = no skill restriction active. */
  readonly active: () => readonly string[] | null;
  /**
   * Applies a loaded skill's `allowedTools`: intersected with the tools the user actually has and
   * with any earlier restriction, so a skill can only narrow, never grant. Empty list = no change.
   */
  readonly activate: (input: { allowedTools: readonly string[] }) => readonly string[];
  readonly isAllowed: (input: { name: string }) => boolean;
};

export type CreateToolRestrictionInput = {
  /** Every tool of this run (MCP tools visible to the AI actor + local tools). */
  available: readonly string[];
  /** Never restricted (skill discovery/loading itself). */
  alwaysAllowed: readonly string[];
};

/** Per-run state behind `load_skill`'s `allowedTools` (one instance per chat request). */
export function createToolRestriction({
  available,
  alwaysAllowed,
}: CreateToolRestrictionInput): ToolRestriction {
  const known = new Set(available);
  const always = new Set(alwaysAllowed);
  let allowed: Set<string> | null = null;
  const active = () => (allowed ? [...new Set([...allowed, ...always])] : null);
  return {
    active,
    activate: ({ allowedTools }) => {
      if (allowedTools.length === 0) return active() ?? available;
      const next = allowedTools.filter((name) => known.has(name) && (allowed?.has(name) ?? true));
      allowed = new Set(next);
      return active() ?? available;
    },
    isAllowed: ({ name }) => always.has(name) || allowed === null || allowed.has(name),
  };
}
