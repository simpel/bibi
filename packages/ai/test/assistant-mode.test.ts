import { describe, expect, it } from "vitest";
import { assistantMode, MODE_FEATURE, modeSection } from "../src/prompt/assistant-mode";

const page = ({ route }: { route: string }) => ({ route, locale: "sv" as const });

describe("assistantMode", () => {
  it("is the first setup on /onboarding only", () => {
    expect(assistantMode({ page: page({ route: "/sv/onboarding" }) })).toBe("first-setup");
    expect(assistantMode({ page: page({ route: "/onboarding/" }) })).toBe("first-setup");
    expect(assistantMode({ page: page({ route: "/sv/onboarding/pipeline" }) })).toBe("assistant");
    expect(assistantMode({ page: page({ route: "/sv/venues" }) })).toBe("assistant");
    expect(assistantMode({})).toBe("assistant");
  });

  it("uses the onboarding model and starts from the first-setup skill", () => {
    expect(MODE_FEATURE["first-setup"]).toBe("onboarding");
    expect(MODE_FEATURE.assistant).toBe("assistant.chat");
    expect(modeSection({ mode: "first-setup" })).toContain('slug: "first-setup"');
    expect(modeSection({ mode: "assistant" })).toBeNull();
  });
});
