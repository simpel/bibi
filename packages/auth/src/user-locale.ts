import { getDb } from "@bibi/db";
import { DEFAULT_LOCALE, type Locale, resolveLocale } from "@bibi/i18n";

export type ResolveUserLocaleInput = {
  email?: string | null;
  userId?: string | null;
};

/**
 * Resolves a user's stored preferred locale from UserProfile (ADR 0061).
 * Falls back to DEFAULT_LOCALE ("sv") if not found or unset.
 */
export async function resolveUserLocale({
  email,
  userId,
}: ResolveUserLocaleInput): Promise<Locale> {
  const db = getDb();

  let resolvedUserId = userId ?? undefined;

  if (!resolvedUserId && email) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    resolvedUserId = user?.id;
  }

  if (resolvedUserId) {
    const profile = await db.userProfile.findUnique({
      where: { userId: resolvedUserId },
      select: { locale: true },
    });
    if (profile?.locale) {
      return resolveLocale({ value: profile.locale });
    }
  }

  return DEFAULT_LOCALE;
}
