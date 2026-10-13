import {
  type ASTVisitor,
  type FieldNode,
  getNamedType,
  GraphQLError,
  type GraphQLObjectType,
  isObjectType,
  Kind,
  type SelectionSetNode,
  type ValidationContext,
} from "graphql";

export type CostLimitRuleInput = { maxCost: number };

/** Assumed list size when `limit` is a variable: core caps every list at 100. */
const VARIABLE_LIMIT = 100;

type CostInput = {
  selectionSet: SelectionSetNode;
  parentType: GraphQLObjectType | null;
  context: ValidationContext;
  seen: ReadonlySet<string>;
};

type MultiplierInput = { field: FieldNode; parentType: GraphQLObjectType | null };

/** List fields multiply their children by `limit` (literal, variable cap, or schema default). */
function multiplierOf({ field, parentType }: MultiplierInput): number {
  const arg = field.arguments?.find((a) => a.name.value === "limit");
  if (arg?.value.kind === Kind.INT) return Number(arg.value.value);
  if (arg) return VARIABLE_LIMIT;
  const def = parentType?.getFields()[field.name.value]?.args.find((a) => a.name === "limit");
  return typeof def?.defaultValue === "number" ? def.defaultValue : 1;
}

function costOf({ selectionSet, parentType, context, seen }: CostInput): number {
  let total = 0;
  for (const selection of selectionSet.selections) {
    if (selection.kind === "Field") {
      if (selection.name.value.startsWith("__")) continue;
      const named = parentType ? parentType.getFields()[selection.name.value]?.type : undefined;
      const child = named ? getNamedType(named) : null;
      const childType = isObjectType(child) ? child : null;
      const below = selection.selectionSet
        ? costOf({ selectionSet: selection.selectionSet, parentType: childType, context, seen })
        : 0;
      total += 1 + multiplierOf({ field: selection, parentType }) * below;
    } else if (selection.kind === "InlineFragment") {
      const cond = selection.typeCondition && context.getSchema().getType(selection.typeCondition.name.value);
      const type = isObjectType(cond) ? cond : parentType;
      total += costOf({ selectionSet: selection.selectionSet, parentType: type, context, seen });
    } else {
      const fragment = context.getFragment(selection.name.value);
      if (!fragment || seen.has(fragment.name.value)) continue;
      const cond = context.getSchema().getType(fragment.typeCondition.name.value);
      const type = isObjectType(cond) ? cond : null;
      const next = new Set(seen).add(fragment.name.value);
      total += costOf({ selectionSet: fragment.selectionSet, parentType: type, context, seen: next });
    }
  }
  return total;
}

/** Validation rule: reject operations whose estimated cost (list sizes multiplied) is too high. */
export function costLimitRule({ maxCost }: CostLimitRuleInput) {
  return (context: ValidationContext): ASTVisitor => ({
    OperationDefinition(operation) {
      const root = operation.operation === "mutation" ? context.getSchema().getMutationType() : context.getSchema().getQueryType();
      const cost = costOf({ selectionSet: operation.selectionSet, parentType: root ?? null, context, seen: new Set() });
      if (cost > maxCost) {
        const message = `Query cost limit of ${maxCost} exceeded, estimated ${cost}.`;
        context.reportError(new GraphQLError(message, { nodes: [operation] }));
      }
    },
  });
}
