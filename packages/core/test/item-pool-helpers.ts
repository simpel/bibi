import {
  createEntityType,
  createFieldDefinition,
  createItem,
  createVocabulary,
  type ExecuteContext,
  execute,
} from "../src/index";
import { unwrap } from "./helpers";

type Ctx = { context: ExecuteContext };

/** An equipment type with a single and a multi choice field, a list and ten units. */
export async function createPool({ context }: Ctx) {
  const list = unwrap({
    result: await execute({
      operation: createVocabulary,
      input: { name: "Kind", values: ["Wireless", "Wired"] },
      context,
    }),
  });
  const type = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Projector", capabilities: ["BOOKABLE"] },
      context,
    }),
  });
  const field = unwrap({
    result: await execute({
      operation: createFieldDefinition,
      input: { entityTypeId: type.id, kind: "CHOICE", name: "Kind", vocabularyId: list.id },
      context,
    }),
  });
  const [wireless, wired] = list.values.map((value) => value.id) as [string, string];
  const units: string[] = [];
  for (let n = 1; n <= 10; n++) {
    const fields = { [field.key]: n <= 4 ? wireless : wired };
    const input = { entityTypeId: type.id, name: `Unit ${String(n).padStart(2, "0")}`, fields };
    units.push(unwrap({ result: await execute({ operation: createItem, input, context }) }).id);
  }
  return { type, units, wireless, wired };
}
