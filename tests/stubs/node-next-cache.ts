export const cacheCalls: {
  paths: Array<unknown[]>
  tags: Array<unknown[]>
} = {
  paths: [],
  tags: [],
}

export function resetCacheCalls() {
  cacheCalls.paths = []
  cacheCalls.tags = []
}

export function revalidatePath(...args: unknown[]) {
  cacheCalls.paths.push(args)
}

export function revalidateTag(...args: unknown[]) {
  cacheCalls.tags.push(args)
}

export function unstable_cache<T extends (...args: never[]) => unknown>(operation: T): T {
  return operation
}
