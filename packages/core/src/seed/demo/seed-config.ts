import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { createEntityType } from "../../features/entity-type/write-operations";
import { createFieldDefinition } from "../../features/field-definition/write-operations";
import { createSetup } from "../../features/setup/operations";
import {
  createVocabulary,
  importVocabularyTemplate,
} from "../../features/vocabulary/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoConfig, DemoField, DemoType } from "./config-types";
import type { DemoRefs, FieldRef, TypeRef } from "./demo-refs";
import { seedItemStates } from "./seed-item-states";

export type SeedConfigInput = {
  context: ExecuteContext;
  config: DemoConfig;
  /** `--skip-pipeline`: item types keep their one default state for the first setup. */
  skipStates?: boolean;
};

type ListResult = { id: string; name: string; values: { id: string; name: string }[] };

async function seedLists({ context, config }: SeedConfigInput): Promise<Result<ListResult[]>> {
  const lists: ListResult[] = [];
  for (const template of config.listTemplates) {
    const input = { template };
    const result = await execute({ operation: importVocabularyTemplate, input, context });
    if (!result.ok) return result;
    lists.push(result.value);
  }
  for (const list of config.lists) {
    const input = { name: list.name, values: [...list.values] };
    const result = await execute({ operation: createVocabulary, input, context });
    if (!result.ok) return result;
    lists.push(result.value);
  }
  return ok({ value: lists });
}

type TypeIdOfInput = { refs: DemoRefs; name: string };

/** The id of a type seeded earlier, by name. */
const typeIdOf = ({ refs, name }: TypeIdOfInput) =>
  [refs.itemTypes, refs.customerTypes, refs.contactTypes, refs.ticketTypes]
    .map((types) => types.get(name)?.id)
    .find(Boolean);

type FieldInput = { context: ExecuteContext; refs: DemoRefs; typeId: string; field: DemoField };

async function seedField({ context, refs, typeId, field }: FieldInput) {
  const list = field.list ? refs.lists.get(field.list) : undefined;
  if (field.list && !list) {
    const message = `Unknown list ${field.list}`;
    return err({ error: new AppError({ code: "INTERNAL", message }) });
  }
  const linkTypeId = field.linkType ? typeIdOf({ refs, name: field.linkType }) : undefined;
  if (field.linkType && !linkTypeId) {
    const message = `Unknown link type ${field.linkType}`;
    return err({ error: new AppError({ code: "INTERNAL", message }) });
  }
  const input = {
    entityTypeId: typeId,
    name: field.name,
    kind: field.kind,
    ...(list ? { vocabularyId: list.id } : {}),
    ...(linkTypeId ? { linkTypeId } : {}),
    ...(field.options ? { options: [...field.options] } : {}),
  };
  return execute({ operation: createFieldDefinition, input, context });
}

type TypeInput = { context: ExecuteContext; refs: DemoRefs; type: DemoType; skipStates: boolean };

async function seedType({ context, refs, type, skipStates }: TypeInput): Promise<Result<TypeRef>> {
  const input = {
    ...{ base: type.base, name: type.name, capabilities: [...(type.capabilities ?? [])] },
    ...{ setupMinutes: type.setupMinutes ?? null, teardownMinutes: type.teardownMinutes ?? null },
  };
  const created = await execute({ operation: createEntityType, input, context });
  if (!created.ok) return created;
  const fields = new Map<string, FieldRef>();
  for (const field of type.fields ?? []) {
    const result = await seedField({ context, refs, typeId: created.value.id, field });
    if (!result.ok) return result;
    const list = field.list ? refs.lists.get(field.list) : undefined;
    const values = list ? new Map(list.values.map((value) => [value.name, value.id])) : undefined;
    const { key, linkTypeId } = result.value;
    fields.set(field.name, {
      key,
      ...(values ? { values } : {}),
      ...(linkTypeId ? { linkTypeId } : {}),
    });
  }
  if (type.states && !skipStates) {
    const states = await seedItemStates({
      context,
      entityTypeId: created.value.id,
      template: type.states,
      bookable: type.capabilities?.includes("BOOKABLE") ?? false,
    });
    if (!states.ok) return states;
  }
  return ok({ value: { id: created.value.id, fields } });
}

/** Slice 2 of ADR 0025: lists, setups, types and fields, all via `execute` as SYSTEM. */
export async function seedDemoConfig({
  context,
  config,
  skipStates = false,
}: SeedConfigInput): Promise<Result<DemoRefs>> {
  const lists = await seedLists({ context, config });
  if (!lists.ok) return lists;
  const refs: DemoRefs = {
    lists: new Map(lists.value.map((list) => [list.name, list])),
    setups: new Map(),
    itemTypes: new Map(),
    customerTypes: new Map(),
    contactTypes: new Map(),
    ticketTypes: new Map(),
  };
  for (const setup of config.setups) {
    const result = await execute({ operation: createSetup, input: setup, context });
    if (!result.ok) return result;
    refs.setups.set(setup.name, result.value.id);
  }
  for (const type of config.types) {
    const result = await seedType({ context, refs, type, skipStates });
    if (!result.ok) return result;
    const byBase = {
      ITEM: refs.itemTypes,
      CUSTOMER: refs.customerTypes,
      CONTACT: refs.contactTypes,
      TICKET: refs.ticketTypes,
    };
    byBase[type.base as keyof typeof byBase]?.set(type.name, result.value);
  }
  return ok({ value: refs });
}
