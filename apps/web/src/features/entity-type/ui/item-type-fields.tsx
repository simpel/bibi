import type { UseFormReturn } from "react-hook-form";
import { BufferFields } from "@/components/form/buffer-fields";
import { CapabilityField } from "./capability-field";
import type { EntityTypeFormOutput, EntityTypeFormValues } from "./entity-type-form-schema";
import { type GroupOption, GroupSelectField } from "./group-select-field";
import { ResourceKindField } from "./resource-kind-field";

export type ItemTypeFieldsProps = {
  form: UseFormReturn<EntityTypeFormValues, unknown, EntityTypeFormOutput>;
  groups: readonly GroupOption[];
};

/**
 * What only item types have: group, Equipment or Person, and capability sections with setup and
 * teardown inside Availability (ADR 0059).
 */
export function ItemTypeFields({ form, groups }: ItemTypeFieldsProps) {
  return (
    <>
      <GroupSelectField control={form.control} groups={groups} />
      <ResourceKindField control={form.control} />
      <CapabilityField
        control={form.control}
        settings={{ BOOKABLE: <BufferFields form={form} inherits={null} /> }}
      />
    </>
  );
}
