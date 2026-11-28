import { getEnv } from "@bibi/config";
import type { PublicBookingPageDto } from "@bibi/core/schemas";
import { Wordmark } from "@bibi/ui";
import { MailIcon, PhoneIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { CSSProperties, ReactNode } from "react";

export type BookingShellProps = {
  /** Null when the organization has no published page (a manage link still works). */
  page: Pick<
    PublicBookingPageDto,
    | "organizationName"
    | "slug"
    | "hasLogo"
    | "hasCover"
    | "accentColor"
    | "contactPhone"
    | "contactEmail"
  > | null;
  title: string;
  children: ReactNode;
};

// The page's accent replaces the primary colour on this page only (ADR 0119). Core refuses an
// accent under 4.5:1 against white, so white text on it always reads.
const BRANDED =
  "[--primary:var(--brand)] [--primary-foreground:white] [--ring:var(--brand)] dark:[--ring:var(--brand)]";

// A guest page carries the venue's look, not Bibi's: plain white, light always, plain sans-serif
// headings. The venue's accent is the only colour.
const PLAIN =
  "[color-scheme:light] [--background:white] [--foreground:oklch(0.2_0_0)] [--card:white] [--popover:white] [--muted:oklch(0.97_0_0)] [--muted-foreground:oklch(0.45_0_0)] [--accent:oklch(0.97_0_0)] [--accent-foreground:oklch(0.2_0_0)] [--border:oklch(0.91_0_0)] [--input:oklch(0.87_0_0)] [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans";

/** A guest page's frame: the venue's cover, logo and name on plain white, contact and "Powered by Bibi" below. */
export async function BookingShell({ page, title, children }: BookingShellProps) {
  const t = await getTranslations("guestBooking");
  const accent = page?.accentColor ?? null;
  const style = accent ? ({ "--brand": accent } as CSSProperties) : undefined;
  const { PUBLIC_ORIGIN, WEB_ORIGIN } = getEnv();
  const image = ({ kind }: { kind: "logo" | "cover" }) =>
    `/book/${encodeURIComponent(page?.slug ?? "")}/${kind}`;
  return (
    <div
      style={style}
      className={`fixed inset-0 overflow-y-auto bg-white text-foreground ${PLAIN} ${accent ? BRANDED : ""}`}
    >
      <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-5 py-8 sm:py-12">
        {page?.hasCover ? (
          // biome-ignore lint/performance/noImgElement: the venue's upload, streamed by the booking route
          <img
            src={image({ kind: "cover" })}
            alt=""
            className="mb-6 aspect-[5/2] w-full rounded-lg object-cover"
          />
        ) : null}
        <header className="flex items-center gap-3">
          {page?.hasLogo ? (
            // biome-ignore lint/performance/noImgElement: the venue's upload, streamed by the booking route
            <img
              src={image({ kind: "logo" })}
              alt={t("logoAlt", { organization: page.organizationName })}
              className="size-14 shrink-0 object-contain"
            />
          ) : null}
          <div className="min-w-0">
            {page ? (
              <p className="truncate text-sm text-muted-foreground">{page.organizationName}</p>
            ) : null}
            <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
          </div>
        </header>
        <div className="pt-6">{children}</div>
        <footer className="mt-auto flex flex-col items-center gap-3 pt-12 text-sm text-muted-foreground">
          <ContactLinks page={page} />
          <a
            href={PUBLIC_ORIGIN ?? WEB_ORIGIN}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-sm text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("poweredBy")}
            <Wordmark size={16} className="text-current" />
          </a>
        </footer>
      </div>
    </div>
  );
}

type ContactLinksProps = Pick<BookingShellProps, "page">;

/** The venue's phone and email as links, when it gave them. */
async function ContactLinks({ page }: ContactLinksProps) {
  const t = await getTranslations("guestBooking.contact");
  if (!page?.contactPhone && !page?.contactEmail) return null;
  const link =
    "inline-flex min-h-11 items-center gap-1.5 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="flex flex-wrap justify-center gap-x-5">
      {page.contactPhone ? (
        <a href={`tel:${page.contactPhone.replace(/\s+/g, "")}`} className={link}>
          <PhoneIcon aria-hidden className="size-4" />
          {t("call", { phone: page.contactPhone })}
        </a>
      ) : null}
      {page.contactEmail ? (
        <a href={`mailto:${page.contactEmail}`} className={link}>
          <MailIcon aria-hidden className="size-4" />
          {t("email", { email: page.contactEmail })}
        </a>
      ) : null}
    </div>
  );
}
