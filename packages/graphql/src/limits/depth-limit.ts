import {
  type ASTVisitor,
  GraphQLError,
  type SelectionSetNode,
  type ValidationContext,
} from "graphql";

export type DepthLimitRuleInput = { maxDepth: number };

type DepthInput = {
  selectionSet: SelectionSetNode;
  context: ValidationContext;
  seen: ReadonlySet<string>;
};

function depthOf({ selectionSet, context, seen }: DepthInput): number {
  let deepest = 0;
  for (const selection of selectionSet.selections) {
    if (selection.kind === "Field") {
      if (selection.name.value.startsWith("__")) continue; // introspection is exempt
      const below = selection.selectionSet
        ? depthOf({ selectionSet: selection.selectionSet, context, seen })
        : 0;
      deepest = Math.max(deepest, 1 + below);
    } else if (selection.kind === "InlineFragment") {
      deepest = Math.max(deepest, depthOf({ selectionSet: selection.selectionSet, context, seen }));
    } else {
      const fragment = context.getFragment(selection.name.value);
      if (!fragment || seen.has(fragment.name.value)) continue;
      const next = new Set(seen).add(fragment.name.value);
      deepest = Math.max(
        deepest,
        depthOf({ selectionSet: fragment.selectionSet, context, seen: next }),
      );
    }
  }
  return deepest;
}

/** Validation rule: reject operations nested deeper than `maxDepth` (fragments followed). */
export function depthLimitRule({ maxDepth }: DepthLimitRuleInput) {
  return (context: ValidationContext): ASTVisitor => ({
    OperationDefinition: (operation) => {
      const depth = depthOf({ selectionSet: operation.selectionSet, context, seen: new Set() });
      if (depth > maxDepth) {
        const message = `Query depth limit of ${maxDepth} exceeded, found ${depth}.`;
        context.reportError(new GraphQLError(message, { nodes: [operation] }));
      }
    },
  });
}
