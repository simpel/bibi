import { Avatar, cn } from "@bibi/ui";
import {
  BanknoteIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CalendarPlusIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CircleMinusIcon,
  CircleSlashIcon,
  ClipboardListIcon,
  ContactIcon,
  EyeIcon,
  HourglassIcon,
  type LucideIcon,
  TagIcon,
  UserCheckIcon,
  UserIcon,
  UsersIcon,
  UsersRoundIcon,
  UserXIcon,
} from "lucide-react";
import type { QueryIcon, QuerySuggestion } from "./lib/query-suggestion-types";

const ICONS: Record<QueryIcon, LucideIcon> = {
  involves: UsersRoundIcon,
  definition: ClipboardListIcon,
  responsibility: BriefcaseIcon,
  assignee: UserIcon,
  follower: EyeIcon,
  status: CircleDotIcon,
  type: TagIcon,
  customer: BuildingIcon,
  contact: ContactIcon,
  is: CircleCheckIcon,
  when: CalendarIcon,
  created: CalendarPlusIcon,
  guests: UsersIcon,
  budget: BanknoteIcon,
  holds: HourglassIcon,
  no: CircleSlashIcon,
  none: UserXIcon,
  some: UserCheckIcon,
  me: UserIcon,
  exclude: CircleMinusIcon,
};

function Visual({ visual }: Pick<QuerySuggestion, "visual">) {
  if (visual.kind === "avatar")
    return <Avatar size="sm" name={visual.name} photoUrl={visual.photoUrl} />;
  const Icon = ICONS[visual.icon] ?? CircleDotIcon;
  return (
    <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

export type QuerySuggestionRowProps = {
  suggestion: QuerySuggestion;
  id: string;
  active: boolean;
  onPick: () => void;
};

/** One row: icon or photo, the label and a muted detail (hint or email). */
export function QuerySuggestionRow({ suggestion, id, active, onPick }: QuerySuggestionRowProps) {
  return (
    <div
      id={id}
      role="option"
      tabIndex={-1}
      aria-selected={active}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm",
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
      )}
      // Keep focus in the input, so typing goes on after the pick.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPick}
      onKeyDown={(event) => {
        if (event.key === "Enter") onPick();
      }}
    >
      <Visual visual={suggestion.visual} />
      <span className="truncate font-medium">{suggestion.label}</span>
      {suggestion.detail ? (
        <span className="ml-auto truncate text-xs text-muted-foreground">{suggestion.detail}</span>
      ) : null}
    </div>
  );
}
