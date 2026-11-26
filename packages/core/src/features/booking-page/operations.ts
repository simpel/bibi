import type { BookingPage } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { checkImageKey } from "../file/image-key";
import { contrastOnWhite, MIN_ACCENT_CONTRAST } from "./contrast";
import {
  type BookingPageDto,
  BookingPageGetInputSchema,
  BookingPageSchema,
  type BookingPageUpdateInput,
  BookingPageUpdateInputSchema,
} from "./schema";

const texts = ({ value }: { value: unknown }): BookingPageDto["intro"] => {
  const parsed = BookingPageSchema.shape.intro.safeParse(value);
  return parsed.success ? parsed.data : {};
};

const EMPTY: BookingPageDto = {
  slug: null,
  logoKey: null,
  coverKey: null,
  accentColor: null,
  intro: {},
  policy: {},
  contactPhone: null,
  contactEmail: null,
  embedOrigins: [],
  published: false,
};

export const toPageDto = ({ row }: { row: BookingPage | null }): BookingPageDto =>
  row
    ? {
        slug: row.slug,
        logoKey: row.logoKey,
        coverKey: row.coverKey,
        accentColor: row.accentColor,
        intro: texts({ value: row.intro }),
        policy: texts({ value: row.policy }),
        contactPhone: row.contactPhone,
        contactEmail: row.contactEmail,
        embedOrigins: row.embedOrigins,
        published: row.published,
      }
    : EMPTY;

type CheckInput = {
  context: Pick<OperationContext, "actor">;
  input: BookingPageUpdateInput;
  current: BookingPageDto;
  slug: string | null;
};

/** Images are the caller's uploads, the accent is readable and a published page has a slug. */
function checkPage({ context, input, current, slug }: CheckInput): Result<true> {
  for (const [path, key, was] of [
    ["logoKey", input.logoKey, current.logoKey],
    ["coverKey", input.coverKey, current.coverKey],
  ] as const) {
    const image = checkImageKey({ context, key, current: was, path });
    if (!image.ok) return image;
  }
  if (input.accentColor && contrastOnWhite({ hex: input.accentColor }) < MIN_ACCENT_CONTRAST) {
    const message = "The colour is too light to read on white; pick a darker one";
    return invalid({ message, issues: [{ path: "accentColor", message }] });
  }
  if (!slug) {
    const message = "Give the page an address (slug) first";
    return invalid({ message, issues: [{ path: "slug", message }] });
  }
  return ok({ value: true });
}

export const getBookingPage = defineOperation({
  name: "bookingPage.get",
  kind: "query",
  description:
    "The organization's public booking page (ADR 0119): address, logo, cover, accent colour, " +
    "texts in sv and en, contact details, sites allowed to embed it and whether it is published.",
  input: BookingPageGetInputSchema,
  output: BookingPageSchema,
  permission: "diningSetup:read",
  handler: async ({ context }) =>
    ok({ value: toPageDto({ row: await context.db.bookingPage.findFirst({}) }) }),
});

export const updateBookingPage = defineOperation({
  name: "bookingPage.update",
  kind: "command",
  description:
    "Edit the booking page: address (slug, unique across Bibi, required on the first save; a slug in use is CONFLICT), logo and cover (keys from " +
    "file.upload), accent colour (refused under 4.5:1 contrast on white), texts, contact " +
    "details, embed origins and published. Omitted fields are unchanged.",
  input: BookingPageUpdateInputSchema,
  output: BookingPageSchema,
  permission: "diningSetup:write",
  handler: async ({ input, context }) => {
    const row = await context.db.bookingPage.findFirst({});
    const before = toPageDto({ row });
    const slug = input.slug ?? before.slug;
    const checked = checkPage({ context, input, current: before, slug });
    if (!checked.ok) return checked;
    const data = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
    // A slug another organization uses fails the unique index: CONFLICT.
    const saved = row
      ? await context.db.bookingPage.update({ where: { id: row.id }, data })
      : await context.db.bookingPage.create({
          data: { ...data, slug: input.slug ?? "", organizationId: context.organizationId },
        });
    const after = toPageDto({ row: saved });
    context.recordChange({ entityId: saved.id, before, after });
    return ok({ value: after });
  },
});

export const bookingPageOperations = [getBookingPage, updateBookingPage];
