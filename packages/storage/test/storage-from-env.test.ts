import { getEnv } from "@bibi/config";
import { describe, expect, it } from "vitest";
import { storageFromEnv } from "../src/index";

describe("storageFromEnv", () => {
  it("selects disk by default", () => {
    expect(storageFromEnv({ env: { ...getEnv(), STORAGE_DRIVER: "disk" } }).name).toBe("disk");
  });

  it("selects s3 when STORAGE_DRIVER=s3", () => {
    const env = {
      ...getEnv(),
      STORAGE_DRIVER: "s3" as const,
      S3_ENDPOINT: "https://s3.example.test",
      S3_REGION: "eu-1",
      S3_BUCKET: "bibi",
      S3_ACCESS_KEY: "id",
      S3_SECRET_KEY: "secret",
    };
    expect(storageFromEnv({ env }).name).toBe("s3");
  });
});
