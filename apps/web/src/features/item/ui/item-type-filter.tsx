"use client";

import type { EntityTypeDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import {
  Form,
  FormController,
  FormItem,
  FormLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { ROUTES } from "@/lib/routes";

export type ItemTypeFilterProps = { types: EntityTypeDto[]; typeId?: string | undefined };

const ALL = "all";

type TypeOptionsProps = { types: EntityTypeDto[] };

function TypeOptions({ types }: TypeOptionsProps) {
  const t = useTranslations("item");
  return (
    <SelectContent>
      <SelectItem value={ALL}>{t("allTypes")}</SelectItem>
      {types.map(({ id, name }) => (
        <SelectItem key={id} value={id}>
          {name}
        </SelectItem>
      ))}
    </SelectContent>
  );
}

/** Type filter above the catalog. A filter form (CLAUDE.md "Forms"): the URL is the state. */
export function ItemTypeFilter({ types, typeId }: ItemTypeFilterProps) {
  const t = useTranslations("item");
  const router = useRouter();
  const form = useForm<{ type: string }>({ defaultValues: { type: typeId ?? ALL } });
  const go = ({ value }: { value: string }) =>
    router.push(value === ALL ? ROUTES.items : { pathname: ROUTES.items, query: { type: value } });
  return (
    <Form {...form}>
      <form className="max-w-xs" onSubmit={(event) => event.preventDefault()}>
        <FormController
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">{t("filterLabel")}</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  go({ value });
                }}
              >
                <SelectTrigger aria-label={t("filterLabel")}>
                  <SelectValue />
                </SelectTrigger>
                <TypeOptions types={types} />
              </Select>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
