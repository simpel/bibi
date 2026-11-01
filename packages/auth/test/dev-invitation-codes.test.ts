import { describe, expect, it } from "vitest";
import { listDevInvitationCodes } from "../src/index";

describe("dev invite codes (ADR 0078)", () => {
  it("never lists codes outside development: a code is a credential", async () => {
    expect(await listDevInvitationCodes({ email: "nora.vik@lindholmen-demo.bibi.test" })).toEqual(
      [],
    );
  });
});
