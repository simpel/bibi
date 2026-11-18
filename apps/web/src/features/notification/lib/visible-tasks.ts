type VisibleTasksInput<T extends { key: string }> = {
  /** `undefined` while the first read is under way, `null` without `order:read`. */
  tasks: readonly T[] | null | undefined;
  /** The page the tasks were read again for; null when they are the shell's first read. */
  readFor: string | null;
  /** Each task the member dismissed, with the page they were on. */
  dismissed: ReadonlyMap<string, string>;
  pathname: string;
};

/**
 * Needs you as the panel shows it (ADR 0114): a task dismissed on this page stays, greyed out; one
 * dismissed on an earlier page is gone, unless a read for this page still has it (its facts
 * changed, so the server shows it again).
 */
export function visibleTasks<T extends { key: string }>({
  tasks,
  readFor,
  dismissed,
  pathname,
}: VisibleTasksInput<T>): { tasks: readonly T[] | null | undefined; dimmed: ReadonlySet<string> } {
  const dimmed = new Set<string>();
  if (!tasks || dismissed.size === 0) return { tasks, dimmed };
  const shown = tasks.filter((task) => {
    const on = dismissed.get(task.key);
    if (on === undefined) return true;
    if (on === pathname) {
      dimmed.add(task.key);
      return true;
    }
    return readFor === pathname;
  });
  return { tasks: shown, dimmed };
}
