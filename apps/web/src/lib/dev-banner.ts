import type { DevService } from "./dev-services";

export type FormatDevBannerInput = { services: DevService[] };

const rule = "─".repeat(64);

/** Console message listing the local dev services and where to find them. */
export function formatDevBanner({ services }: FormatDevBannerInput): string {
  const lines = services.map(
    ({ name, url, note }) => `  ${name.padEnd(10)} ${url.padEnd(26)} ${note}`,
  );
  return [
    "",
    rule,
    " Bibi dev environment",
    rule,
    ...lines,
    "",
    ' Tip: the "Dev users" button in the bottom-right corner switches seeded user.',
    rule,
    "",
  ].join("\n");
}
