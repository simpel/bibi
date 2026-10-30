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
  boards: readonly Pick<BoardDto, "id" | "name">[];
  /** The board shown. */
  boardId: string | null;
  /** Keep customize mode when switching. */
  customize?: boolean;
};

/** Picks the board to show (ADR 0067); the first board is the default. Everyone can switch. */
export function BoardSwitcher({ boards, boardId, customize = false }: BoardSwitcherProps) {
  const t = useTranslations("board");
  const current = boards.find((board) => board.id === boardId) ?? boards[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label={t("switcherLabel")}>
          {t("switcher", { name: current?.name ?? "" })}
          <ChevronDownIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {boards.map((board, index) => (
          <DropdownMenuItem key={board.id} asChild>
            <Link href={pipelineHref({ boardId: index === 0 ? null : board.id, customize })}>
              {board.name}
              {index === 0 ? (
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
