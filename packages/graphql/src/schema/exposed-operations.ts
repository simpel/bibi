const exposed = new Set<string>();

export type MarkExposedInput = { name: string };

/** Called by the `*FromOperation` helpers so the parity test can diff against the registry. */
export function markExposed({ name }: MarkExposedInput): void {
  exposed.add(name);
}

export function exposedOperationNames(): string[] {
  return [...exposed].sort();
}
