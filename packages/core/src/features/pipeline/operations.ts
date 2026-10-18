import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { buildColumns } from "./columns";
import { loadBookingCards, loadInquiryCards } from "./load-cards";
import { PipelineBoardInputSchema, PipelineBoardSchema } from "./schema";

const DAY_MS = 86_400_000;

export const pipelineBoard = defineOperation({
  name: "pipeline.board",
  kind: "query",
  description:
    "The pipeline board: lanes left to right (inquiry stages NEW, QUALIFIED, QUOTED, then the " +
    "organization's booking statuses by phase, then closed lanes for lost inquiries and cancelled " +
    "bookings) and one card per inquiry or booking with its lane. Filter by assignee or type. " +
    "Completed, cancelled and lost items appear only for `closedWithinDays` days.",
  input: PipelineBoardInputSchema,
  output: PipelineBoardSchema,
  permission: "booking:read",
  handler: async ({ input, context }) => {
    const since = new Date(Date.now() - input.closedWithinDays * DAY_MS);
    const statuses = await context.db.bookingStatus.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
    const [inquiries, bookings] = await Promise.all([
      loadInquiryCards({ context, input, since }),
      loadBookingCards({ context, input, since }),
    ]);
    return ok({
      value: { columns: buildColumns({ statuses }), cards: [...inquiries, ...bookings] },
    });
  },
});

export const pipelineOperations = [pipelineBoard];
