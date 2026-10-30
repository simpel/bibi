import { byId, type ParityEntity, tool } from "./parity-entities";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

type Phase = Record<string, unknown> & { id: string };
const phaseOf = ({ board, id }: { board: { phases: Phase[] }; id: string }) =>
  board.phases.find((phase) => phase.id === id);

const ticketStatus = byId({
  name: "ticketStatus",
  field: "ticketStatus",
  list: "ticket-statuses",
  createTool: "ticketStatus_create",
  args: { name: "Parity status", color: "#22c55e", entry: true },
});

const board = byId({
  name: "board",
  field: "board",
  list: "boards",
  createTool: "board_create",
  args: { name: "Parity board" },
  nested: {
    phases: "{ id boardId name color position statusIds status createdAt updatedAt createdBy }",
  },
});

/** A phase (ADR 0067) of the board made earlier; read back through the board's phases. */
const boardPhase: ParityEntity = {
  name: "boardPhase",
  create: ({ mcp, made }) =>
    tool({
      mcp,
      name: "boardPhase_create",
      args: { boardId: made.board.id, name: "Parity phase", color: "#22c55e" },
    }),
  viaMcp: async ({ mcp, created }) =>
    phaseOf({
      board: await tool({ mcp, name: "board_get", args: { id: created.boardId } }),
      id: created.id,
    }),
  viaRest: async ({ context, created }) =>
    phaseOf({
      board: await createRestClient({ context }).get({ path: `/boards/${created.boardId}` }),
      id: created.id,
    }),
  viaGraph: async ({ context, created, keys }) => {
    const query = `query($id: String!) { board(id: $id) { phases { ${keys.join(" ")} } } }`;
    const data = await gqlQuery({ context, query, variables: { id: created.boardId } });
    return phaseOf({ board: data.board, id: created.id });
  },
};

/** The pipeline's entities in creation order: a status, then a board and one of its phases. */
export function boardEntities(): ParityEntity[] {
  return [ticketStatus, board, boardPhase];
}
