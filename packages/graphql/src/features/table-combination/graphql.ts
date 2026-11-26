import {
  listTableCombinations,
  saveTableCombinations,
  type TableCombinationDto,
  TableCombinationSchema,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const TableCombinationRef = objectFromSchema<TableCombinationDto>({
  name: "TableCombination",
  schema: TableCombinationSchema,
  description: "Tables of one layout booked together for one party.",
});
const TableCombinationListRef = pageType({
  name: "TableCombinationList",
  item: TableCombinationRef,
});

fieldFromOperation({
  operation: listTableCombinations,
  type: TableCombinationListRef,
  name: "tableCombinations",
});
mutationFromOperation({ operation: saveTableCombinations, type: TableCombinationListRef });
