// Shared tile-grid renderer for the desktop wallpaper and the route preloader.
//
// Pure Canvas 2D drawing — no React, no DOM events. Each caller computes its own
// per-tile `proximities` field (mouse distance for the wallpaper, a travelling
// wave for the preloader) and hands it to `drawGrid`. Keeping the render here
// means the two surfaces share one visual language instead of duplicating it.

// ── Colours ──────────────────────────────────────────────────────────────────
export const BASE_BG   = '#070707' // --color-bgs  brand reveal backdrop
export const TILE_FILL = '#111111' // --color-bg   tile fill
export const BRAND     = '#F22F57' // --color-brand

// ── Border ───────────────────────────────────────────────────────────────────
// Adjacent tiles share every boundary so the stroke is drawn TWICE per line.
// Per-call alpha overlaps to ≈ rgba(255,255,255,0.2), matching the CSS grid.
export const BORDER_COLOR = 'rgba(255,255,255,0.02)'
export const BORDER_WIDTH = 1.5 // matches --border

// ── "+" intersection marks ───────────────────────────────────────────────────
export const PLUS_COLOR    = 'rgba(255,255,255,0.1)'
export const PLUS_WIDTH    = 1.5
export const PLUS_ARM_FRAC = 0.08 // arm length = max(4 px, tileSize × this)

// Column count per viewport width — mirrors the responsive --cols in styles.css.
export function getCols(w: number): number {
  if (w >= 1536) return 32
  if (w >= 1280) return 20
  if (w >= 768) return 12
  return 6
}

export interface Grid {
  cols: number
  rows: number
  tileSize: number
}

// Square tiles sized to the viewport width; one extra row of overscan so the
// grid always covers the bottom edge.
export function computeGrid(w: number, h: number): Grid {
  const cols = getCols(w)
  const tileSize = w / cols
  const rows = Math.ceil(h / tileSize) + 1
  return { cols, rows, tileSize }
}

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  r = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export interface DrawGridOptions {
  cols: number
  rows: number
  tileSize: number
  /** Per-tile proximity 0..1 (rows*cols) — drives brand glow + rounded corners. */
  proximities: Float32Array
  /**
   * Per-tile scale 0..1 (rows*cols). Tiles draw centred in their cell at
   * `tileSize * scale`. Omit for full-size tiles (scale 1). Used by the reveal
   * to shrink tiles toward nothing.
   */
  scales?: Float32Array
  /**
   * When true, clear the canvas to transparent instead of painting BASE_BG, so
   * shrunk tiles expose whatever is behind the canvas (the reveal). Default false.
   */
  clear?: boolean
  /**
   * Draw the brand glow layer behind the tiles. Default true. Set false so a
   * rounding tile exposes whatever is behind the canvas through its corners
   * (the reveal) instead of the brand colour (the wallpaper's resting look).
   */
  brand?: boolean
  /** Canvas drawing width/height in CSS px (device-independent). */
  width: number
  height: number
}

export function drawGrid(ctx: CanvasRenderingContext2D, o: DrawGridOptions): void {
  const { cols, rows, tileSize, proximities, scales, width: w, height: h } = o

  if (o.clear) ctx.clearRect(0, 0, w, h)
  else {
    ctx.fillStyle = BASE_BG
    ctx.fillRect(0, 0, w, h)
  }

  // Drawing rect for a tile, honouring its scale (centred shrink toward the cell centre).
  const tileX = (c: number, size: number) => c * tileSize + (tileSize - size) / 2
  const tileY = (r: number, size: number) => r * tileSize + (tileSize - size) / 2
  const tileSizeAt = (r: number, c: number) => (scales ? tileSize * scales[r * cols + c] : tileSize)

  // 1) Brand glow under active tiles. Skipped when brand === false so the
  //    rounding tile's corners expose the cleared (transparent) backdrop.
  if (o.brand !== false) {
    ctx.fillStyle = BRAND
    ctx.beginPath()
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (proximities[r * cols + c] < 0.01) continue
        const size = tileSizeAt(r, c)
        if (size <= 0) continue
        ctx.rect(tileX(c, size), tileY(r, size), size, size)
      }
    }
    ctx.fill()
  }

  // 2) Tile fill + border, corner radius scaled by proximity.
  ctx.beginPath()
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const size = tileSizeAt(r, c)
      if (size <= 0) continue
      const rnd = proximities[r * cols + c]
      roundedRect(ctx, tileX(c, size), tileY(r, size), size, size, rnd * size * 0.5)
    }
  }
  ctx.fillStyle = TILE_FILL
  ctx.fill()
  ctx.strokeStyle = BORDER_COLOR
  ctx.lineWidth = BORDER_WIDTH
  ctx.stroke()

  // 3) "+" intersection marks — arms shrink near active tiles (and with the reveal scale).
  const ARM_MAX = Math.max(4, tileSize * PLUS_ARM_FRAC)
  ctx.strokeStyle = PLUS_COLOR
  ctx.lineWidth = PLUS_WIDTH
  ctx.beginPath()
  for (let c = 1; c < cols; c++) {
    for (let r = 1; r < rows; r++) {
      const avgRnd =
        (proximities[(r - 1) * cols + (c - 1)] +
          proximities[(r - 1) * cols + c] +
          proximities[r * cols + (c - 1)] +
          proximities[r * cols + c]) /
        4

      let arm = ARM_MAX * (1 - avgRnd)
      if (scales) {
        const avgScale =
          (scales[(r - 1) * cols + (c - 1)] +
            scales[(r - 1) * cols + c] +
            scales[r * cols + (c - 1)] +
            scales[r * cols + c]) /
          4
        arm *= avgScale
      }
      if (arm < 0.5) continue

      const ix = c * tileSize
      const iy = r * tileSize
      ctx.moveTo(ix - arm, iy)
      ctx.lineTo(ix + arm, iy)
      ctx.moveTo(ix, iy - arm)
      ctx.lineTo(ix, iy + arm)
    }
  }
  ctx.stroke()
}
