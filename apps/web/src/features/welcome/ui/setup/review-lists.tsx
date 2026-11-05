import { useTranslations } from "next-intl";

export type ReviewListsProps = { spaces: string[]; food: string[]; extras: string[] };

/** The chosen types, in three short lists. */
export function ReviewLists({ spaces, food, extras }: ReviewListsProps) {
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
    <div className="grid gap-4 sm:grid-cols-3">
      {list({ title: t("spaces"), names: spaces })}
      {list({ title: t("food"), names: food })}
      {list({ title: t("extras"), names: extras })}
    </div>
  );
}
