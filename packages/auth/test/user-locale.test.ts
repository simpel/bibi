import { getDb } from "@bibi/db";
import { DEFAULT_LOCALE } from "@bibi/i18n";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { resolveUserLocale } from "../src/user-locale";

describe("resolveUserLocale", () => {
  it("returns DEFAULT_LOCALE ('sv') when no user exists or arguments are empty", async () => {
    expect(await resolveUserLocale({})).toBe(DEFAULT_LOCALE);
    expect(await resolveUserLocale({ email: "nonexistent@bibi.test" })).toBe(DEFAULT_LOCALE);
    expect(await resolveUserLocale({ userId: "nonexistent-id" })).toBe(DEFAULT_LOCALE);
  });

  it("resolves user preferred locale by userId or email", async () => {
    const db = getDb();
    const userId = createId();
    const email = `locale-test-${userId}@bibi.test`;

    await db.user.create({
      data: {
        id: userId,
        email,
        name: "Locale User",
        emailVerified: true,
      },
    });

    await db.userProfile.create({
      data: {
        userId,
        firstName: "Locale",
        lastName: "User",
        phone: "+46700000000",
        locale: "en",
      },
    });

    // Resolving by userId
    expect(await resolveUserLocale({ userId })).toBe("en");

    // Resolving by email
    expect(await resolveUserLocale({ email })).toBe("en");

    // Updating profile to "sv"
    await db.userProfile.update({
      where: { userId },
      data: { locale: "sv" },
    });

    expect(await resolveUserLocale({ userId })).toBe("sv");
    expect(await resolveUserLocale({ email })).toBe("sv");
  });
});
