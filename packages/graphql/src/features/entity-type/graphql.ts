import {
  archiveEntityType,
  createEntityType,
  type EntityTypeDto,
  EntityTypeSchema,
  getEntityType,
  listEntityTypes,
  updateEntityType,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { FieldDefinitionRef } from "../field-definition/graphql";

export const EntityTypeRef = objectFromSchema<EntityTypeDto>({
  name: "EntityType",
  schema: EntityTypeSchema,
  omit: ["organizationId", "fields"],
  description: "Type – an organization-defined kind of item or customer, e.g. Konferensrum.",
});
const EntityTypePageRef = pageType({ name: "EntityTypePage", item: EntityTypeRef });

builder.objectField(EntityTypeRef, "fields", (t) =>
  t.field({
    type: [FieldDefinitionRef],
    description: "Active fields of the type, in display order.",
    resolve: (entityType) => entityType.fields,
  }),
);

fieldFromOperation({ operation: listEntityTypes, type: EntityTypePageRef, name: "entityTypes" });
fieldFromOperation({ operation: getEntityType, type: EntityTypeRef, name: "entityType" });
mutationFromOperation({ operation: createEntityType, type: EntityTypeRef });
mutationFromOperation({ operation: updateEntityType, type: EntityTypeRef });
mutationFromOperation({ operation: archiveEntityType, type: EntityTypeRef });
