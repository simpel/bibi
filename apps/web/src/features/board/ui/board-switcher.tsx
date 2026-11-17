import type { BoardDto } from "@bibi/core/schemas";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import { Link } from "@/lib/navigation";

export type BoardSwitcherProps = {
  boards: readonly Pick<BoardDto, "id" | "name" | "isDefault">[];
  /** The board shown. */
  boardId: string | null;
  /** Keep customize mode when switching. */
  customize?: boolean;
};

/** Picks the view to show (ADR 0067, 0111): the default first, then the caller's other views. */
export function BoardSwitcher({ boards, boardId, customize = false }: BoardSwitcherProps) {
  const t = useTranslations("board");
  const current = boards.find((board) => board.id === boardId) ?? boards.find((b) => b.isDefault);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label={t("switcherLabel")}>
          {t("switcher", { name: current?.name ?? "" })}
          <ChevronDownIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {boards.map((board) => (
          <DropdownMenuItem key={board.id} asChild>
            <Link href={pipelineHref({ boardId: board.isDefault ? null : board.id, customize })}>
              {board.name}
              {board.isDefault ? (
                <Badge variant="secondary" className="ml-auto">
                  {t("default")}
                </Badge>
              ) : null}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
