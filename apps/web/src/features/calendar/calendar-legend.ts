import type { ItemStateDto } from "@okazi/core/schemas";
import type { TypeOption } from "./calendar-types";

/** One legend entry: a state that draws a block (hold SOFT or HARD); released states never do. */
export type LegendState = {
  id: string;
  /** The name, with the type's name added when two states share it. */
  name: string;
  color: string;
  soft: boolean;
};

export type BuildLegendInput = {
  states: readonly ItemStateDto[];
  /** The item types of the spaces shown; states of other types are left out. */
  typeIds: ReadonlySet<string>;
  types: readonly TypeOption[];
};

/** The organization's own states for the types on screen, in the type's order. */
export function buildLegend({ states, typeIds, types }: BuildLegendInput): LegendState[] {
  const drawn = states.filter(
    (state) =>
      state.status === "ACTIVE" && state.hold !== "NONE" && typeIds.has(state.entityTypeId),
  );
  const count = ({ name }: { name: string }) => drawn.filter((state) => state.name === name).length;
  const typeName = ({ id }: { id: string }) => types.find((type) => type.id === id)?.name;
  return drawn.map((state) => {
    const suffix =
      count({ name: state.name }) > 1 ? typeName({ id: state.entityTypeId }) : undefined;
    const name = suffix ? `${state.name} (${suffix})` : state.name;
    return { id: state.id, name, color: state.color, soft: state.hold === "SOFT" };
  });
}
