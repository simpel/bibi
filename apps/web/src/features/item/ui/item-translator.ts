import type { getTranslations } from "next-intl/server";

/** The `item` messages translator of a server component. */
export type ItemTranslator = Awaited<ReturnType<typeof getTranslations<"item">>>;
