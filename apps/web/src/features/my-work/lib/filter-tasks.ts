type FilterableTask = {
  reference: number | null;
  taskTypeName: string | null;
  title: string | null;
  customerName: string | null;
  lineName: string | null;
  runSheetName: string | null;
};

type FilterTasksInput<T extends FilterableTask> = { tasks: readonly T[]; query: string };

/**
 * The tasks whose order (reference, title, customer) or subject (task, line, run sheet) holds the text,
 * case-insensitively; every task when the text is blank.
 */
export function filterTasks<T extends FilterableTask>({ tasks, query }: FilterTasksInput<T>): T[] {
  const text = query.trim().toLowerCase();
  if (text === "") return [...tasks];
  return tasks.filter((task) =>
    [
      task.reference === null ? null : `#${task.reference}`,
      ...[task.title, task.customerName, task.taskTypeName, task.lineName, task.runSheetName],
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(text),
  );
}
