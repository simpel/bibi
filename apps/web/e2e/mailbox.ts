import { expect, type Page } from "@playwright/test";

/** Mailpit's HTTP API (docker compose locally, a service container in CI). */
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";

type MailpitSummary = { ID: string; Created: string };

export type OpenMagicLinkInput = { page: Page; email: string; sentAfter: Date };

/** The sign-in link in the newest mail to `email` sent after `sentAfter`, waiting for it to arrive. */
async function magicLinkFor({
  page,
  email,
  sentAfter,
}: Omit<OpenMagicLinkInput, "page"> & { page: Page }) {
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const query = encodeURIComponent(`to:"${email}"`);
        const search = await page.request.get(`${MAILPIT_URL}/api/v1/search?query=${query}`);
        const { messages } = (await search.json()) as { messages: MailpitSummary[] };
        const latest = messages.find((m) => new Date(m.Created) >= sentAfter);
        if (!latest) return undefined;
        const message = await page.request.get(`${MAILPIT_URL}/api/v1/message/${latest.ID}`);
        const { Text } = (await message.json()) as { Text: string };
        link = Text.match(/https?:\/\/\S*magic-link\/verify\S*/)?.[0];
        return link;
      },
      { timeout: 15_000, message: `no sign-in link mailed to ${email}` },
    )
    .toBeTruthy();
  return link as string;
}

/** Opens the magic link mailed to `email` in the page, as a user clicking it in their inbox. */
export async function openMagicLink({ page, email, sentAfter }: OpenMagicLinkInput) {
  await page.goto(await magicLinkFor({ page, email, sentAfter }));
}
