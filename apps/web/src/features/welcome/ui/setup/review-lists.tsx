import { useTranslations } from "next-intl";

export type ReviewListsProps = { book: string[]; sell: string[] };

/** The chosen types, in two short lists. */
export function ReviewLists({ book, sell }: ReviewListsProps) {
  const t = useTranslations("welcome.setup.review");
  const list = ({ title, names }: { title: string; names: string[] }) => (
    <div className="grid gap-2 rounded-lg border p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      {names.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {names.map((name) => (
            <li key={name} className="rounded-md bg-muted px-2 py-1 text-sm">
              {name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("none")}</p>
      )}
    </div>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {list({ title: t("book"), names: book })}
      {list({ title: t("sell"), names: sell })}
    </div>
  );
}
