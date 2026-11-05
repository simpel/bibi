import { describe, expect, it } from "vitest";
import { readFileBase64 } from "./read-file-base64";

describe("readFileBase64", () => {
  it("converts a File to a base64 string without data prefix", async () => {
    const content = "hello world";
    const blob = new Blob([content], { type: "text/plain" });
    const file = new File([blob], "test.txt", { type: "text/plain" });

    const base64 = await readFileBase64({ file });
    expect(base64).toBe(Buffer.from(content).toString("base64"));
  });
});
