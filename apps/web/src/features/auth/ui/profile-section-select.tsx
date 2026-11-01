"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { jumpToSection } from "./jump-to-section";
import type { ProfileSectionLink } from "./profile-sections";

export type ProfileSectionSelectProps = { sections: ProfileSectionLink[]; label: string };

/** The section nav on small screens: a dropdown that jumps to the chosen card. */
export function ProfileSectionSelect({ sections, label }: ProfileSectionSelectProps) {
  return (
    <Select onValueChange={(id) => jumpToSection({ id })}>
      <SelectTrigger aria-label={label} className="w-full md:hidden">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {sections.map(({ id, label: name }) => (
          <SelectItem key={id} value={id}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
