"use client";

import { Button, FormControl, FormController, FormItem, FormLabel, FormMessage } from "@bibi/ui";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

const MAX_PARTY = 99;

export type PartyStepperProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
};

/** Party size by tapping: big minus and plus around the number, no keyboard needed. */
export function PartyStepper<V extends FieldValues, O>({
  form,
  name,
  label,
}: PartyStepperProps<V, O>) {
  const t = useTranslations("reservation.create");
  return (
    <FormController
      control={form.control}
      name={name}
      render={({ field }) => {
        const count = Number(field.value) || 1;
        const set = ({ to }: { to: number }) =>
          field.onChange(String(Math.min(MAX_PARTY, Math.max(1, to))));
        return (
          <FormItem>
            <FormLabel>
              {label}
              <span className="ml-0.5 text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="size-12"
                  aria-label={t("fewer")}
                  disabled={count <= 1}
                  onClick={() => set({ to: count - 1 })}
                >
                  <MinusIcon className="size-5" />
                </Button>
                <output className="min-w-12 text-center text-2xl font-medium tabular-nums">
                  {count}
                </output>
                <Button
                  type="button"
                  variant="outline"
                  className="size-12"
                  aria-label={t("more")}
                  disabled={count >= MAX_PARTY}
                  onClick={() => set({ to: count + 1 })}
                >
                  <PlusIcon className="size-5" />
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
