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

/** A guest page's frame: the venue's cover, logo and name on top, contact and "Powered by Bibi" below. */
export async function BookingShell({ page, title, children }: BookingShellProps) {
  const t = await getTranslations("guestBooking");
  const accent = page?.accentColor ?? null;
  const style = accent ? ({ "--brand": accent } as CSSProperties) : undefined;
  const { PUBLIC_ORIGIN, WEB_ORIGIN } = getEnv();
  const image = ({ kind }: { kind: "logo" | "cover" }) =>
    `/book/${encodeURIComponent(page?.slug ?? "")}/${kind}`;
  return (
    <div style={style} className={accent ? `w-full max-w-lg ${BRANDED}` : "w-full max-w-lg"}>
      <article className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
        {page?.hasCover ? (
          // biome-ignore lint/performance/noImgElement: the venue's upload, streamed by the booking route
          <img src={image({ kind: "cover" })} alt="" className="aspect-[5/2] w-full object-cover" />
        ) : null}
        <header className="flex items-center gap-3 px-5 pt-6 sm:px-8 sm:pt-8">
          {page?.hasLogo ? (
            // biome-ignore lint/performance/noImgElement: the venue's upload, streamed by the booking route
            <img
              src={image({ kind: "logo" })}
              alt={t("logoAlt", { organization: page.organizationName })}
              className="size-12 shrink-0 rounded-lg border bg-background object-contain p-1"
            />
          ) : null}
          <div className="min-w-0">
            {page ? (
              <p className="truncate text-sm text-muted-foreground">{page.organizationName}</p>
            ) : null}
            <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
          </div>
        </header>
        <div className="px-5 pt-5 pb-6 sm:px-8 sm:pb-8">{children}</div>
      </article>
      <footer className="mt-4 flex flex-col items-center gap-3 px-2 text-sm text-muted-foreground">
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
