import type { PipelineSetupDraft } from "@okazi/core/schemas";
import type { UseFormReturn } from "react-hook-form";
import type { SetupFormValues } from "./setup-form-schema";

/** The wizard's form as every step receives it. */
export type SetupForm = UseFormReturn<SetupFormValues, unknown, PipelineSetupDraft>;
