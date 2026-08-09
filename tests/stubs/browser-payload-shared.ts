export function formatAdminURL({ apiRoute, path }: { apiRoute: string; path: string }) {
  return `${apiRoute.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}
