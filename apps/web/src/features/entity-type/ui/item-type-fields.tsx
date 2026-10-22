import type { UseFormReturn } from "react-hook-form";
import { BufferFields } from "@/components/form/buffer-fields";
import { CapabilityField } from "./capability-field";
import type { EntityTypeFormOutput, EntityTypeFormValues } from "./entity-type-form-schema";

export type ItemTypeFieldsProps = {
  form: UseFormReturn<EntityTypeFormValues, unknown, EntityTypeFormOutput>;
};

/** What only item types have: capability sections, with setup and teardown inside Availability (ADR 0059). */
export function ItemTypeFields({ form }: ItemTypeFieldsProps) {
  return (
    <CapabilityField
      control={form.control}
      settings={{ BOOKABLE: <BufferFields form={form} inherits={null} /> }}
    />
  );
}
