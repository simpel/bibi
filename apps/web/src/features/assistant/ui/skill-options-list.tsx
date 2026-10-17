"use client";

import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { SkillOption } from "../skill-actions";

export type SkillOptionsListProps = {
  skills: SkillOption[];
  failed: boolean;
  onPick: (input: { skill: SkillOption }) => void;
};

/** The searchable skill rows inside the picker: the name only, the description on hover. */
export function SkillOptionsList({ skills, failed, onPick }: SkillOptionsListProps) {
  const t = useTranslations("assistant.skills");
  return (
    <CommandList>
      <CommandEmpty>{failed ? t("failed") : t("empty")}</CommandEmpty>
      <CommandGroup heading={t("label")}>
        {skills.map((skill) => (
          <HoverCard key={skill.id}>
            <HoverCardTrigger asChild>
              <CommandItem
                value={`${skill.name} ${skill.description}`}
                onSelect={() => onPick({ skill })}
              >
                {skill.name}
              </CommandItem>
            </HoverCardTrigger>
            <HoverCardContent side="right" align="start">
              <p className="font-medium">{skill.name}</p>
              <p className="mt-1 text-muted-foreground">{skill.description}</p>
            </HoverCardContent>
          </HoverCard>
        ))}
      </CommandGroup>
    </CommandList>
  );
}
