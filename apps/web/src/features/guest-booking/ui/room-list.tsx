import type { PublicBookingPageDto } from "@bibi/core/schemas";
import { ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";

export type RoomListProps = { page: Pick<PublicBookingPageDto, "slug" | "rooms"> };

/** The page's dining rooms as large links: the guest picks where to sit first. */
export async function RoomList({ page }: RoomListProps) {
  const t = await getTranslations("guestBooking.rooms");
  if (page.rooms.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }
  return (
    <section aria-labelledby="rooms-heading" className="flex flex-col gap-3">
      <h2 id="rooms-heading" className="text-sm font-medium">
        {t("description")}
      </h2>
      <ul className="flex flex-col gap-2">
        {page.rooms.map((room) => (
          <li key={room.slug}>
            <Link
              href={`/book/${page.slug}/${room.slug}`}
              className="flex min-h-14 items-center gap-3 rounded-lg border bg-background px-4 py-3 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 flex-1 truncate text-base font-medium">{room.name}</span>
              <ChevronRightIcon aria-hidden className="size-5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
