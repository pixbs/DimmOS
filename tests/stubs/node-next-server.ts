let pendingTasks: Promise<void>[] = []

export function after(task: () => Promise<void>) {
  pendingTasks.push(Promise.resolve().then(task))
}

export async function drainAfterTasks() {
  const tasks = pendingTasks
  pendingTasks = []
  await Promise.all(tasks)
}
