import { describe, expect, it } from "vitest";
import { type SkillFormValues, skillFormDefaults, skillFormSchema } from "./skill-form-schema";

const values: SkillFormValues = {
  ...skillFormDefaults({}),
  name: " Offert ",
  description: "När en offert ska sammanställas",
  instructions: "1. Hämta rum\n2. Räkna",
  allowedTools: "room_list, venue_list\nsearch",
  resources: [
    { name: "mall.md", content: "# Mall" },
    { name: "", content: "" },
  ],
};

describe("skill form schema", () => {
  it("maps form strings to the core create input", () => {
    const parsed = skillFormSchema.safeParse(values);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toMatchObject({
      scope: "PERSONAL",
      name: "Offert",
      allowedTools: ["room_list", "venue_list", "search"],
      resources: [{ name: "mall.md", content: "# Mall" }],
    });
    expect(parsed.data.slug).toBeUndefined();
  });

  it("rejects an empty name and an invalid tool name using core's rules", () => {
    const empty = skillFormSchema.safeParse({ ...values, name: " " });
    expect(empty.success).toBe(false);
    const badTool = skillFormSchema.safeParse({ ...values, allowedTools: "Not A Tool!" });
    expect(badTool.success).toBe(false);
  });
});
