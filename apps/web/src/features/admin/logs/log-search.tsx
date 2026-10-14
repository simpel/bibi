import { Button, Input } from "@okazi/ui";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export type LogSearchProps = { value: string | undefined; onSearch: (q: string | null) => void };

/** Free-text search; applied on submit (Enter), not per keystroke. */
export function LogSearch({ value, onSearch }: LogSearchProps) {
  const t = useTranslations("admin.logs.filters");
  const [q, setQ] = useState(value ?? "");
  useEffect(() => setQ(value ?? ""), [value]);
  return (
    <search className="flex min-w-64 flex-1">
      <form
        className="flex flex-1 gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(q.trim() || null);
        }}
      >
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
        />
        <Button type="submit" variant="secondary" size="icon" aria-label={t("apply")}>
          <SearchIcon />
        </Button>
      </form>
    </search>
  );
}
