'use client'

/** Small palette for tag dots; a tag's colour is derived deterministically from its title. */
const TAG_PALETTE = ['#F87171', '#34D399', '#60A5FA', '#FBBF24', '#A78BFA', '#F472B6', '#22D3EE']

/** Pick a stable colour for a tag from its title (same title → same colour). */
export function tagColor(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) >>> 0
  return TAG_PALETTE[hash % TAG_PALETTE.length]
}

/**
 * Render tags as coloured dots + labels (the Works grid/table style). Renders
 * nothing when there are no tags.
 */
export function TagList({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null
  return (
    <span className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className ?? ''}`}>
      {tags.map((tag) => (
        <span key={tag} data-tag={tag} className="flex items-center gap-1.5 font-medium text-fg">
          <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: tagColor(tag) }}
          />
          {tag}
        </span>
      ))}
    </span>
  )
}
