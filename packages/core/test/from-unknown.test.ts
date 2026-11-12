import { Prisma } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { fromUnknown } from "../src/errors/from-unknown";

function prismaError({ code, postgresCode }: { code: string; postgresCode?: unknown }) {
  return new Prisma.PrismaClientKnownRequestError("boom", {
    code,
    clientVersion: "test",
    meta: { driverAdapterError: { cause: { code: postgresCode } } },
  });
}

describe("fromUnknown with Postgres codes behind P2039", () => {
  it("maps an exclusion violation (23P01) to CONFLICT", () => {
    const error = fromUnknown({ error: prismaError({ code: "P2039", postgresCode: "23P01" }) });
    expect(error.code).toBe("CONFLICT");
  });

  it("maps a check violation (23514) to VALIDATION", () => {
    const error = fromUnknown({ error: prismaError({ code: "P2039", postgresCode: "23514" }) });
    expect(error.code).toBe("VALIDATION");
  });

  it("maps a deadlock (40P01), a serialization failure (40001) and P2034 to CONFLICT", () => {
    for (const postgresCode of ["40P01", "40001"]) {
      const error = fromUnknown({ error: prismaError({ code: "P2039", postgresCode }) });
      expect(error.code).toBe("CONFLICT");
    }
    expect(fromUnknown({ error: prismaError({ code: "P2034" }) }).code).toBe("CONFLICT");
  });

  it("falls back to INTERNAL for an unrecognised nested code", () => {
    const error = fromUnknown({ error: prismaError({ code: "P2039", postgresCode: "99999" }) });
    expect(error.code).toBe("INTERNAL");
  });

  it("falls back to INTERNAL when the nested code is missing or not a string", () => {
    const missing = new Prisma.PrismaClientKnownRequestError("boom", {
      code: "P2039",
      clientVersion: "test",
    });
    expect(fromUnknown({ error: missing }).code).toBe("INTERNAL");
    expect(fromUnknown({ error: prismaError({ code: "P2039", postgresCode: 23514 }) }).code).toBe(
      "INTERNAL",
    );
  });
});
