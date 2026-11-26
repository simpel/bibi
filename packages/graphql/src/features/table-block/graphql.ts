import {
  createTableBlock,
  deleteTableBlock,
  listTableBlocks,
  type TableBlockDto,
  TableBlockSchema,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

export const TableBlockRef = objectFromSchema<TableBlockDto>({
  name: "TableBlock",
  schema: TableBlockSchema,
  description: "A table staff held back: from everyone, or from guests only.",
});

const TableBlockListRef = builder
  .objectRef<{ items: TableBlockDto[] }>("TableBlockList")
  .implement({
    description: "Table blocks by start time.",
    fields: (t) => ({
      items: t.field({ type: [TableBlockRef], resolve: (list) => list.items }),
    }),
  });

fieldFromOperation({ operation: listTableBlocks, type: TableBlockListRef, name: "tableBlocks" });
mutationFromOperation({ operation: createTableBlock, type: TableBlockListRef });
mutationFromOperation({ operation: deleteTableBlock, type: TableBlockRef });
