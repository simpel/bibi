import "server-only";
import { getTask, type Result, type TaskDto } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadTaskCached = cache(async (id: string): Promise<Result<TaskDto>> => {
  return runOperation({ operation: getTask, input: { id } });
});

export type LoadTaskInput = { id: string };

/** The task by its id, cached per request so metadata and the page share one read. */
export function loadTask({ id }: LoadTaskInput): Promise<Result<TaskDto>> {
  return loadTaskCached(id);
}
