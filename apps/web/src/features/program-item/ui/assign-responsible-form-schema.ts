import { ProgramItemAssignInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { NONE } from "../../booking/ui/option-select-field";

/** Raw value of the responsible form: a user id, or `NONE` for no one. */
export type AssignResponsibleFormValues = { responsibleId: string };

export type AssignResponsibleFormOutput = z.infer<typeof ProgramItemAssignInputSchema>;

/** Core's `programItem.assign` schema; null removes the responsible person. */
export const assignResponsibleFormSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: ProgramItemAssignInputSchema,
    toInput: ({ values }: { values: AssignResponsibleFormValues }) => ({
      id,
      responsibleId:
        values.responsibleId === NONE || values.responsibleId === "" ? null : values.responsibleId,
    }),
  });
