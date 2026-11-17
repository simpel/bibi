import type { BoardDto } from "@bibi/core/schemas";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Label,
  Switch,
} from "@bibi/ui";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { ShareMember } from "@/features/pipeline/load-pipeline-data";
import { useToastAction } from "@/lib/use-toast-action";
import { shareBoardAction } from "../actions";

export type ShareBoardFormProps = {
  board: Pick<BoardDto, "id" | "ownerId" | "sharedWithOrganization" | "sharedWithUserIds">;
  members: readonly ShareMember[];
  /** After each save, e.g. to refresh the page. */
  onSaved: () => void;
};

type Sharing = { everyone: boolean; picked: ReadonlySet<string> };

/**
 * `board.share` (ADR 0111): everyone in the organization, or the members ticked. Each choice
 * saves at once (easy to change back); a failed save puts the choice back.
 */
export function ShareBoardForm({ board, members, onSaved }: ShareBoardFormProps) {
  const t = useTranslations("board.share");
  const id = useId();
  const [sharing, setSharing] = useState<Sharing>(() => ({
    everyone: board.sharedWithOrganization,
    picked: new Set(board.sharedWithUserIds),
  }));
  const { run, pending } = useToastAction();
  const others = members.filter(({ userId }) => userId !== board.ownerId);
  // Who it was shared with when the form opened comes first; rows do not jump while ticking.
  const shared = new Set(board.sharedWithUserIds);
  const sorted = [
    ...others.filter(({ userId }) => shared.has(userId)),
    ...others.filter(({ userId }) => !shared.has(userId)),
  ];
  const save = ({ next }: { next: Sharing }) => {
    const previous = sharing;
    setSharing(next);
    run({
      action: () =>
        shareBoardAction({
          input: { id: board.id, organization: next.everyone, userIds: [...next.picked] },
        }),
      messages: { pending: t("saving"), success: t("saved") },
      onSuccess: onSaved,
      onError: () => setSharing(previous),
    });
  };
  const toggle = ({ userId, on }: { userId: string; on: boolean }) => {
    const picked = new Set(sharing.picked);
    if (on) picked.add(userId);
    else picked.delete(userId);
    save({ next: { ...sharing, picked } });
  };
  const { everyone, picked } = sharing;
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`${id}-everyone`}>{t("everyone")}</Label>
        <Switch
          id={`${id}-everyone`}
          checked={everyone}
          disabled={pending}
          onCheckedChange={(on) => save({ next: { ...sharing, everyone: on } })}
        />
      </div>
      {everyone ? (
        <p className="text-muted-foreground text-sm">{t("everyoneHint")}</p>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor={`${id}-search`}>{t("people")}</Label>
          {others.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noPeople")}</p>
          ) : (
            <Command className="rounded-md border">
              <CommandInput id={`${id}-search`} placeholder={t("search")} />
              <CommandList className="max-h-56">
                <CommandEmpty>{t("noMatches")}</CommandEmpty>
                {sorted.map(({ userId, name }) => {
                  const on = picked.has(userId);
                  return (
                    <CommandItem
                      key={userId}
                      value={`${name} ${userId}`}
                      disabled={pending}
                      onSelect={() => toggle({ userId, on: !on })}
                    >
                      <CheckIcon aria-hidden className={on ? "opacity-100" : "opacity-0"} />
                      {name}
                    </CommandItem>
                  );
                })}
              </CommandList>
            </Command>
          )}
        </div>
      )}
    </div>
  );
}
