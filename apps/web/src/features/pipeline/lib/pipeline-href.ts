import { ROUTES } from "@/lib/routes";

export type PipelineHrefInput = {
  /** The board to show; omitted for the default (first) board. */
  boardId?: string | null | undefined;
  /** Customize mode: columns flip to their settings (needs `pipeline:write`). */
  customize?: boolean;
};

/** `/pipeline`, `/pipeline?board=<id>` and `…&mode=customize`: the board and mode are filters. */
export function pipelineHref({ boardId, customize = false }: PipelineHrefInput): string {
  const query = new URLSearchParams();
  if (boardId) query.set("board", boardId);
  if (customize) query.set("mode", "customize");
  const search = query.toString();
  return search ? `${ROUTES.pipeline}?${search}` : ROUTES.pipeline;
}

export type PipelineSearch = { board?: string | string[]; mode?: string | string[] };

/** The route's search params → the board id and whether customize mode was asked for. */
export function readPipelineSearch({ search }: { search: PipelineSearch }) {
  const board = Array.isArray(search.board) ? search.board[0] : search.board;
  const mode = Array.isArray(search.mode) ? search.mode[0] : search.mode;
  return { boardId: board || undefined, customize: mode === "customize" };
}
