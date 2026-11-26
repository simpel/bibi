import {
  archiveDiningService,
  createDiningService,
  type DiningServiceDto,
  type DiningServiceExceptionDto,
  DiningServiceExceptionSchema,
  DiningServiceSchema,
  deleteDiningServiceException,
  getDiningService,
  listDiningServiceExceptions,
  listDiningServices,
  setDiningServiceException,
  type TurnTime,
  TurnTimeSchema,
  updateDiningService,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

const TurnTimeRef = objectFromSchema<TurnTime>({
  name: "TurnTime",
  schema: TurnTimeSchema,
  description: "How long a party keeps its table: up to this many people, this many minutes.",
});

export const DiningServiceRef = objectFromSchema<DiningServiceDto>({
  name: "DiningService",
  schema: DiningServiceSchema,
  omit: ["turnTimes"],
  description: "A sitting: when a dining room takes table bookings.",
});
builder.objectField(DiningServiceRef, "turnTimes", (t) =>
  t.field({
    type: [TurnTimeRef],
    description: "Ordered rows; the last row also covers larger parties.",
    resolve: (service) => service.turnTimes,
  }),
);
const DiningServiceListRef = pageType({ name: "DiningServiceList", item: DiningServiceRef });

export const DiningServiceExceptionRef = objectFromSchema<DiningServiceExceptionDto>({
  name: "DiningServiceException",
  schema: DiningServiceExceptionSchema,
  description: "One date's change to a sitting: closed, other hours, layout or pace.",
});
const DiningServiceExceptionListRef = pageType({
  name: "DiningServiceExceptionList",
  item: DiningServiceExceptionRef,
});

fieldFromOperation({
  operation: listDiningServices,
  type: DiningServiceListRef,
  name: "diningServices",
});
fieldFromOperation({ operation: getDiningService, type: DiningServiceRef, name: "diningService" });
mutationFromOperation({ operation: createDiningService, type: DiningServiceRef });
mutationFromOperation({ operation: updateDiningService, type: DiningServiceRef });
mutationFromOperation({ operation: archiveDiningService, type: DiningServiceRef });
fieldFromOperation({
  operation: listDiningServiceExceptions,
  type: DiningServiceExceptionListRef,
  name: "diningServiceExceptions",
});
mutationFromOperation({ operation: setDiningServiceException, type: DiningServiceExceptionRef });
mutationFromOperation({ operation: deleteDiningServiceException, type: DiningServiceExceptionRef });
