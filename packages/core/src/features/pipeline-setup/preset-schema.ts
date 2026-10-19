import { z } from "zod";
import { SETUP_PRESET_KEYS } from "../../templates/setup-presets/setup-presets";

/** Input of `pipelineSetup.presetDraft`: which setup preset to start from (ADR 0045). */
export const PipelinePresetDraftInputSchema = z.object({
  key: z
    .enum(SETUP_PRESET_KEYS)
    .describe(
      "The preset: conference-estate (meeting rooms, food and activities), restaurant " +
        "(private rooms, food and drink), experience-centre (halls, guides and tours) or empty",
    ),
});

export type PipelinePresetDraftInput = z.infer<typeof PipelinePresetDraftInputSchema>;
