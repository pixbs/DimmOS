export function usePathname(): string {
  return window.location.pathname
}

export function useRouter() {
  return {
    push(path: string) {
      window.history.pushState({}, '', path)
    },
    replace(path: string) {
      window.history.replaceState({}, '', path)
    },
    refresh() {},
  }
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search)
}
