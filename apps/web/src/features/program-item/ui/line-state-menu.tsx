import type { ProgramItemDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import {
  ColorSwatch,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { changeLineStateAction, followLinePhaseAction } from "../actions";
import type { LineStateOption } from "./line-state-option";

export type LineStateMenuProps = { programItem: ProgramItemDto; states: LineStateOption[] };

type TargetsProps = { targets: LineStateOption[]; onPick: (input: { stateId: string }) => void };

/** The states the line may move to, each with its color. */
function StateTargets({ targets, onPick }: TargetsProps) {
  const t = useTranslations("programItem");
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t("changeState")}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {targets.map((state) => (
          <DropdownMenuItem key={state.id} onSelect={() => onPick({ stateId: state.id })}>
            <ColorSwatch color={state.color} />
            {state.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/**
 * Row-menu entries for a line's state (ADR 0044): move it to a state its current state allows
 * (an override phase moves skip) and, when overridden, let it follow the phase again.
 */
export function LineStateMenu({ programItem, states }: LineStateMenuProps) {
  const t = useTranslations("programItem");
  const common = useTranslations("common");
  const router = useRouter();
  const { run } = useToastAction();
  const current = states.find((state) => state.id === programItem.stateId);
  if (!current) return null;
  const targets = states.filter((state) => current.transitionsTo.includes(state.id));
  const messages = { pending: common("saving"), success: t("stateChanged") };
  const onSuccess = () => router.refresh();
  const lineId = programItem.id;
  const pick = ({ stateId }: { stateId: string }) =>
    run({ action: () => changeLineStateAction({ lineId, stateId }), messages, onSuccess });
  const follow = () =>
    run({ action: () => followLinePhaseAction({ lineId }), messages, onSuccess });
  return (
    <>
      {targets.length > 0 ? <StateTargets targets={targets} onPick={pick} /> : null}
      {programItem.stateOverridden ? (
        <DropdownMenuItem onSelect={follow}>{t("followPhase")}</DropdownMenuItem>
      ) : null}
    </>
  );
}
