import { describe, expect, it } from "vitest";
import { customerHint } from "./message-hint";

describe("customerHint", () => {
  it("takes the company part of a work domain", () => {
    expect(customerHint({ fromEmail: "anna@volvocars.com" })).toBe("volvocars");
    expect(customerHint({ fromEmail: "Bo@Mail.Hisingen-Energi.SE" })).toBe("hisingen-energi");
  });

  it("starts empty for free mail domains and no email", () => {
    expect(customerHint({ fromEmail: "anna@gmail.com" })).toBeNull();
    expect(customerHint({ fromEmail: null })).toBeNull();
    expect(customerHint({ fromEmail: "broken" })).toBeNull();
  });
});
