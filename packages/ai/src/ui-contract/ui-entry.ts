import type { z } from "zod";
import type { ToolUi, ToolUiEntry, ToolUiProps, UiComponent } from "./tool-ui-types";

export type UiEntryInput<K extends UiComponent, S extends z.ZodType> = {
  component: K;
  /** Zod wire schema of the tool's structured result (derived from core output schemas). */
  schema: S;
  toProps: (input: { value: z.infer<S> }) => ToolUiProps[K];
};

/** Typed registry entry: parse with `schema`, then map to the component's props. */
export function uiEntry<K extends UiComponent, S extends z.ZodType>({
  component,
  schema,
  toProps,
}: UiEntryInput<K, S>): ToolUiEntry {
  return {
    component,
    resolve: ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) return null;
      // Sound by construction: `toProps` returns ToolUiProps[K] for this K.
      return { component, props: toProps({ value: parsed.data }) } as ToolUi;
    },
  };
}
