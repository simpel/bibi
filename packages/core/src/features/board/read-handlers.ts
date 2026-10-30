import type { z } from "zod";
import { ok } from "../../errors/result";
import type { HandlerInput } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { loadBoard, toBoardDto, WITH_PHASES } from "./load-board";
import {
  type BoardIdInputSchema,
  type BoardListInputSchema,
  BoardListOutputSchema,
  BoardSchema,
} from "./schema";

export const listBoardsHandler = async ({
  input,
  context,
}: HandlerInput<z.infer<typeof BoardListInputSchema>>) => {
  const rows = await context.db.board.findMany({
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: WITH_PHASES,
    ...pageArgs(input),
  });
  const boards = rows.map((row) => toBoardDto({ row }));
  return ok({ value: paginate({ rows: boards, limit: input.limit }) });
};

export const getBoardHandler = async ({
  input,
  context,
}: HandlerInput<z.infer<typeof BoardIdInputSchema>>) => {
  const board = await loadBoard({ context, id: input.id });
  return board ? ok({ value: board }) : notFound({ entity: "Board" });
};
