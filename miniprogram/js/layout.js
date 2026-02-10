// Layout calculation for Crossword Master

const LayoutConfig = {
  headerHeight: 44,
  clueBarHeight: 52,
  keyboardHeight: 200,
  gridPadding: 20
}

/**
 * Calculate layout for rows × cols grid
 * Shrink-wraps to content, centered in game area
 */
function calculateLayout(rows, cols, opts) {
  const { W, H, SAFE_TOP, HOME_INDICATOR, Theme } = opts

  const headerH = LayoutConfig.headerHeight
  const clueH = LayoutConfig.clueBarHeight
  const keyboardH = LayoutConfig.keyboardHeight
  const padding = LayoutConfig.gridPadding

  const gameBoardTop = SAFE_TOP + headerH
  const gameBoardBottom = H - HOME_INDICATOR - keyboardH - clueH
  const gameBoardHeight = gameBoardBottom - gameBoardTop
  const gameBoardWidth = W

  const border = Theme.gridBorderWidth
  const gap = Theme.gridGap

  // Max available space (90vw, with padding)
  const maxWidth = Math.min(gameBoardWidth - padding * 2, W * 0.9)
  const maxHeight = gameBoardHeight - padding * 2

  // Calculate cell size to fit both dimensions
  const maxCellByWidth = (maxWidth - 2 * border - (cols - 1) * gap) / cols
  const maxCellByHeight = (maxHeight - 2 * border - (rows - 1) * gap) / rows

  // Enforce min/max cell size
  const minCellSize = 40
  const maxCellSize = 80
  const cellSize = Math.floor(Math.min(
    Math.max(minCellSize, Math.min(maxCellByWidth, maxCellByHeight)),
    maxCellSize
  ))

  // Calculate actual grid dimensions (shrink-wrap)
  const gridWidth = cols * cellSize + (cols - 1) * gap + 2 * border
  const gridHeight = rows * cellSize + (rows - 1) * gap + 2 * border

  // Center grid in game board area
  const gridX = Math.floor((gameBoardWidth - gridWidth) / 2)
  const gridY = gameBoardTop + Math.floor((gameBoardHeight - gridHeight) / 2)

  return {
    headerY: SAFE_TOP,
    headerH,
    gameBoardTop,
    gameBoardBottom,
    gameBoardHeight,
    gridX,
    gridY,
    gridWidth,
    gridHeight,
    rows,
    cols,
    cellSize,
    border,
    gap,
    innerX: gridX + border,
    innerY: gridY + border,
    clueY: H - HOME_INDICATOR - keyboardH - clueH,
    clueH,
    keyboardY: H - HOME_INDICATOR - keyboardH,
    keyboardH,
    homeIndicatorH: HOME_INDICATOR
  }
}

module.exports = { LayoutConfig, calculateLayout }
