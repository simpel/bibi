import { Button, Spinner } from "@bibi/ui";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type RefObject, useRef, useState, useTransition } from "react";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { usePathname } from "@/lib/navigation";
import { useEndInView } from "@/lib/use-end-in-view";
import { useLiveQuery } from "@/lib/use-live-query";
import { loadNotificationFeedAction, type NotificationFeedPage } from "../actions";
import { applyMark } from "../lib/apply-mark";
import type { NotificationLike } from "../lib/notification-like";
import { useNotificationLive } from "./notification-live-context";
import { NotificationRow } from "./notification-row";

const SEARCH_WAIT_MS = 250;

export type NotificationFeedProps = {
  /** The panel's search: the order's title or reference. */
  query: string;
  /** The panel's scroller, for the infinite scroll. */
  root: RefObject<HTMLElement | null>;
  onOpen: (input: { notification: NotificationLike }) => void;
};

/**
 * The panel's unread notifications, newest first (ADR 0094), like an inbox's unread filter: one
 * marked read stays, greyed out, until the next page, which reads the list again. The first page is
 * also read when the panel opens, the search changes or the stream reports a change; later pages
 * as the member scrolls.
 */
export function NotificationFeed({ query, root, onOpen }: NotificationFeedProps) {
  const t = useTranslations("notifications");
  const { changed } = useNotificationLive();
  const pathname = usePathname();
  const q = query.trim();
  const first = useLiveQuery({
    input: { q, changed, pathname },
    load: loadNotificationFeedAction,
    waitMs: q ? SEARCH_WAIT_MS : 0,
  });
  return (
    <section data-slot="notification-feed" className="grid gap-2">
      <h2 className="px-3 pt-2 font-serif text-xl">{t("title")}</h2>
      {first.status === "error" ? <InlineLoadError errorKey={first.errorKey} /> : null}
      {first.status === "ready" ? (
        <FeedPages
          key={`${q}|${changed}|${pathname}`}
          first={first.value}
          q={q}
          root={root}
          onOpen={onOpen}
        />
      ) : first.status === "loading" ? (
        <div className="flex min-h-8 items-center justify-center">
          <Spinner label={t("loading")} />
        </div>
      ) : null}
    </section>
  );
}

type FeedPagesProps = Omit<NotificationFeedProps, "query"> & {
  first: NotificationFeedPage;
  q: string;
};

/** The first page and the ones read on as the end comes into view, with the caller's marks. */
function FeedPages({ first, q, root, onOpen }: FeedPagesProps) {
  const t = useTranslations("notifications");
  const { mark } = useNotificationLive();
  const markRead = t("markRead");
  const [more, setMore] = useState<NotificationFeedPage["items"]>([]);
  const [cursor, setCursor] = useState(first.nextCursor);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  // A mark made before this read is already in it; only a later one is applied here.
  const [readAt] = useState(() => Date.now());
  useEndInView({
    target: end,
    root,
    enabled: cursor !== null && !pending && error === null,
    onEnd: () =>
      startTransition(async () => {
        const result = await loadNotificationFeedAction({ q, cursor });
        if (!result.ok) return setError(errorKeyForCode({ code: result.error.code }));
        setMore((shown) => [...shown, ...result.value.items]);
        setCursor(result.value.nextCursor);
      }),
  });
  const all = [...first.items, ...more];
  const rows = mark && mark.at.getTime() >= readAt ? applyMark({ rows: all, mark }) : all;
  if (rows.length === 0) {
    return (
      <p className="px-3 pb-3 text-sm text-muted-foreground">
        {q ? t("noMatches") : t("nothingNew")}
      </p>
    );
  }
  return (
    <>
      <ul className="grid gap-0.5">
        {rows.map((notification) => (
          <li key={notification.id}>
            <NotificationRow
              notification={notification}
              onOpen={onOpen}
              action={
                notification.readAt === null ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 bg-background"
                    aria-label={markRead}
                    title={markRead}
                    onClick={() => onOpen({ notification })}
                  >
                    <CheckIcon />
                  </Button>
                ) : null
              }
            />
          </li>
        ))}
      </ul>
      <InlineLoadError errorKey={error} />
      <div
        ref={end}
        className="flex min-h-8 items-center justify-center text-xs text-muted-foreground"
      >
        {pending ? <Spinner label={t("loading")} /> : cursor ? null : t("end")}
      </div>
    </>
  );
}
