"use client";

import {
  cn,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, useRef, useState } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { activeMention, insertMention, type Mentionable, matchPeople } from "../lib/mentions";

export type MentionTextareaProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
  placeholder?: string;
  people: readonly Mentionable[];
};

type Active = { start: number; caret: number; options: Mentionable[]; index: number };

/**
 * A comment's text box (ADR 0115): typing `@` and part of a name lists matching colleagues;
 * Enter, Tab or a click puts `@Name` in the text. What is mentioned is read from the text on save.
 */
export function MentionTextarea<V extends FieldValues, O>({
  form,
  name,
  label,
  placeholder,
  people,
}: MentionTextareaProps<V, O>) {
  const t = useTranslations("comment");
  const box = useRef<HTMLTextAreaElement | null>(null);
  const [active, setActive] = useState<Active | null>(null);
  const look = ({ text, caret }: { text: string; caret: number }) => {
    const mention = people.length > 0 ? activeMention({ text, caret }) : null;
    const options = mention ? matchPeople({ people, query: mention.query }) : [];
    setActive(
      mention && options.length > 0 ? { start: mention.start, caret, options, index: 0 } : null,
    );
  };
  return (
    <FormController
      control={form.control}
      name={name}
      render={({ field }) => {
        const pick = ({ person }: { person: Mentionable }) => {
          if (!active) return;
          const next = insertMention({
            text: String(field.value ?? ""),
            ...active,
            name: person.name,
          });
          field.onChange(next.text);
          setActive(null);
          requestAnimationFrame(() => box.current?.setSelectionRange(next.caret, next.caret));
        };
        const onKeyDown = ({ event }: { event: KeyboardEvent<HTMLTextAreaElement> }) => {
          if (!active) return;
          const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
          if (step !== 0) {
            event.preventDefault();
            const index = (active.index + step + active.options.length) % active.options.length;
            setActive({ ...active, index });
          } else if (event.key === "Enter" || event.key === "Tab") {
            event.preventDefault();
            const person = active.options[active.index];
            if (person) pick({ person });
          } else if (event.key === "Escape") setActive(null);
        };
        return (
          <FormItem className="relative">
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                ref={(element) => {
                  box.current = element;
                  field.ref(element);
                }}
                rows={3}
                placeholder={placeholder}
                value={String(field.value ?? "")}
                onChange={(event) => {
                  field.onChange(event.target.value);
                  look({ text: event.target.value, caret: event.target.selectionStart });
                }}
                onKeyDown={(event) => onKeyDown({ event })}
                onBlur={() => {
                  field.onBlur();
                  setActive(null);
                }}
                aria-autocomplete="list"
                aria-expanded={active !== null}
              />
            </FormControl>
            {active ? (
              <div
                role="listbox"
                aria-label={t("mentionList")}
                className="absolute top-full left-0 z-20 mt-1 w-64 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
              >
                {active.options.map((person, index) => (
                  <div
                    key={person.userId}
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === active.index}
                    className={cn(
                      "cursor-pointer rounded-sm px-2 py-1.5 text-sm",
                      index === active.index && "bg-accent text-accent-foreground",
                    )}
                    // Picks before the text box blurs and closes the list.
                    onMouseDown={(event) => {
                      event.preventDefault();
                      pick({ person });
                    }}
                  >
                    {person.name}
                  </div>
                ))}
              </div>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
