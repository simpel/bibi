import {
  getPermissions,
  type PermissionProfile,
  PermissionProfileSchema,
  updatePermissions,
} from "@okazi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

export const PermissionProfileRef = objectFromSchema<PermissionProfile>({
  name: "PermissionProfile",
  schema: PermissionProfileSchema,
  description:
    "A member's or API key's permissions: preset, overrides and the effective result (ADR 0050).",
});

fieldFromOperation({ operation: getPermissions, type: PermissionProfileRef, name: "permission" });
mutationFromOperation({ operation: updatePermissions, type: PermissionProfileRef });
