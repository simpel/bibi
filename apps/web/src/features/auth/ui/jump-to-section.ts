export type JumpToSectionInput = { id: string };

/** Scrolls smoothly to a profile section and puts its anchor in the URL. */
export function jumpToSection({ id }: JumpToSectionInput) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}
