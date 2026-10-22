import { z } from "zod";
import { SETUP_PRESET_KEYS } from "../../templates/setup-presets/setup-presets";

/** Input of `pipelineSetup.presetDraft`: which setup preset to start from (ADR 0061). */
export const PipelinePresetDraftInputSchema = z.object({
  key: z
    .enum(SETUP_PRESET_KEYS)
    .describe(
      "The venue kind (ADR 0061): conference-estate, manor-house, experience-centre, museum, " +
        "restaurant (private rooms), event-hall (event and congress hall), arena-hospitality, " +
        "theatre (theatre and concert hall), meeting-space, or empty",
    ),
});

export type PipelinePresetDraftInput = z.infer<typeof PipelinePresetDraftInputSchema>;
