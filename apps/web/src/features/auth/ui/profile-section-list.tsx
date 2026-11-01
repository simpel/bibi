"use client";

import { jumpToSection } from "./jump-to-section";
import type { ProfileSectionLink } from "./profile-sections";

export type ProfileSectionListProps = { sections: ProfileSectionLink[]; label: string };

/** The section nav on wide screens: a sticky list of anchors that scroll smoothly on click. */
export function ProfileSectionList({ sections, label }: ProfileSectionListProps) {
  return (
    <nav aria-label={label} className="hidden self-stretch md:block">
      <ul className="sticky top-6 grid gap-1 text-sm">
        {sections.map(({ id, label: name }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={(event) => {
                event.preventDefault();
                jumpToSection({ id });
              }}
              className="block rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
