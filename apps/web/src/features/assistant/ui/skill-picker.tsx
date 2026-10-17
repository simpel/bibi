"use client";

import {
  Command,
  CommandInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PromptInputButton,
} from "@okazi/ui";
import { SlashSquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { SkillOption } from "../skill-actions";
import { SkillOptionsList } from "./skill-options-list";
import { useSkillOptions } from "./use-skill-options";

export type SkillPickerProps = { onPick: (input: { skill: SkillOption }) => void };

/** Prompt box toolbar button: lists the skills; picking one adds it to the message. */
export function SkillPicker({ onPick }: SkillPickerProps) {
  const t = useTranslations("assistant.skills");
  const [open, setOpen] = useState(false);
  const { skills, failed, load } = useSkillOptions();
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
      }}
    >
      <PopoverTrigger asChild>
        <PromptInputButton aria-label={t("label")} title={t("label")}>
          <SlashSquareIcon />
        </PromptInputButton>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-80 p-0">
        <Command>
          <CommandInput placeholder={t("search")} />
          <SkillOptionsList
            skills={skills}
            failed={failed}
            onPick={({ skill }) => {
              setOpen(false);
              onPick({ skill });
            }}
          />
        </Command>
      </PopoverContent>
    </Popover>
  );
}
