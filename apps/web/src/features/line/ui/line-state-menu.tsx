import type { LineDto } from "@bibi/core";
import {
  ColorSwatch,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { changeLineStateAction, followLineStatusAction } from "../actions";
import type { LineStateOption } from "./line-state-option";

export type LineStateMenuProps = { line: LineDto; states: LineStateOption[] };

type TargetsProps = { targets: LineStateOption[]; onPick: (input: { stateId: string }) => void };

/** The states the line may move to, each with its color. */
function StateTargets({ targets, onPick }: TargetsProps) {
  const t = useTranslations("line");
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
 * (an override status moves skip) and, when overridden, let it follow the status again.
 */
export function LineStateMenu({ line, states }: LineStateMenuProps) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const router = useRouter();
  const { run } = useToastAction();
  const current = states.find((state) => state.id === line.stateId);
  if (!current) return null;
  const targets = states.filter((state) => current.transitionsTo.includes(state.id));
  const messages = { pending: common("saving"), success: t("stateChanged") };
  const onSuccess = () => router.refresh();
  const lineId = line.id;
  const pick = ({ stateId }: { stateId: string }) =>
    run({ action: () => changeLineStateAction({ lineId, stateId }), messages, onSuccess });
  const follow = () =>
    run({ action: () => followLineStatusAction({ lineId }), messages, onSuccess });
  return (
    <>
      {targets.length > 0 ? <StateTargets targets={targets} onPick={pick} /> : null}
      {line.stateOverridden ? (
        <DropdownMenuItem onSelect={follow}>{t("followStatus")}</DropdownMenuItem>
      ) : null}
    </>
  );
}
