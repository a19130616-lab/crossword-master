/**
 * CrossWord Master v5.0 - Production Quality
 * 
 * Architecture:
 * - Data separated into data.js
 * - Dynamic grid sizing (no fixed size)
 * - Smart direction switching
 * - Auto-skip locked/black cells
 */

console.log('[DEBUG] game.js: Starting load...')

// ===============================================================
// DATA IMPORT
// ===============================================================

console.log('[DEBUG] game.js: About to require data.js')
const { LEVELS, PUZZLES } = require('./data.js')
console.log('[DEBUG] game.js: data.js loaded successfully')

const { Theme, Font } = require('./js/theme')
const { roundRect, inRect } = require('./js/utils')
const { State, loadProgress, saveProgress } = require('./js/state')
const { LayoutConfig, calculateLayout } = require('./js/layout')

// ===============================================================
// HAPTIC FEEDBACK (vibration only, no audio files needed)
// ===============================================================

const Haptics = {
  tap() {
    try { wx.vibrateShort({ type: 'light' }) } catch (e) {}
  },
  
  success() {
    try { wx.vibrateLong() } catch (e) {}
  },
  
  error() {
    try { wx.vibrateShort({ type: 'heavy' }) } catch (e) {}
  }
}

console.log('[DEBUG] game.js: Haptics defined')

// ===============================================================
// SYSTEM INFO & SAFE AREA
// ===============================================================

console.log('[DEBUG] game.js: Getting system info...')
const sys = wx.getSystemInfoSync()
console.log('[DEBUG] game.js: System info OK')
const W = sys.windowWidth
const H = sys.windowHeight

const safeArea = sys.safeArea || { top: 0, bottom: H }
const STATUS_BAR = sys.statusBarHeight || 20
const SAFE_TOP = Math.max(STATUS_BAR, safeArea.top || 0)
const SAFE_BOTTOM = H - (safeArea.bottom || H)
const HOME_INDICATOR = Math.max(SAFE_BOTTOM, 34)

const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')

// ===============================================================
// DESIGN TOKENS
// ===============================================================

// ===============================================================
// LAYOUT ENGINE (Dynamic, shrink-wraps to content)
// ===============================================================

// ===============================================================
// GAME STATE
// ===============================================================

// ===============================================================
// STORAGE
// ===============================================================

// ===============================================================
// PUZZLE LOGIC
// ===============================================================

/**
 * Calculate bounding box of actual content
 */
function calculateBoundingBox(solution) {
  let minRow = Infinity, maxRow = -1
  let minCol = Infinity, maxCol = -1
  
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution[r].length; c++) {
      if (solution[r][c] !== null) {
        minRow = Math.min(minRow, r)
        maxRow = Math.max(maxRow, r)
        minCol = Math.min(minCol, c)
        maxCol = Math.max(maxCol, c)
      }
    }
  }
  
  if (maxRow === -1) return null
  return { minRow, maxRow, minCol, maxCol }
}

/**
 * Trim grid to bounding box
 */
function trimGrid(puzzleData) {
  const bounds = calculateBoundingBox(puzzleData.solution)
  if (!bounds) return null
  
  const { minRow, maxRow, minCol, maxCol } = bounds
  const rows = maxRow - minRow + 1
  const cols = maxCol - minCol + 1
  
  // Trim solution
  const trimmedSolution = []
  for (let r = minRow; r <= maxRow; r++) {
    const row = []
    for (let c = minCol; c <= maxCol; c++) {
      row.push(puzzleData.solution[r][c])
    }
    trimmedSolution.push(row)
  }
  
  // Remap prefilled
  const trimmedPrefilled = puzzleData.prefilled
    .filter(([r, c]) => r >= minRow && r <= maxRow && c >= minCol && c <= maxCol)
    .map(([r, c]) => [r - minRow, c - minCol])
  
  // Remap clues
  const trimmedClues = {
    across: puzzleData.clues.across
      .filter(cl => cl.row >= minRow && cl.row <= maxRow && cl.col >= minCol && cl.col <= maxCol)
      .map(cl => ({ ...cl, row: cl.row - minRow, col: cl.col - minCol })),
    down: puzzleData.clues.down
      .filter(cl => cl.row >= minRow && cl.row <= maxRow && cl.col >= minCol && cl.col <= maxCol)
      .map(cl => ({ ...cl, row: cl.row - minRow, col: cl.col - minCol }))
  }
  
  return {
    ...puzzleData,
    rows,
    cols,
    solution: trimmedSolution,
    prefilled: trimmedPrefilled,
    clues: trimmedClues,
    bounds
  }
}

function initPuzzle(level, index) {
  const rawPuzzleData = PUZZLES[level]?.[index]
  if (!rawPuzzleData) return false
  
  const puzzleData = trimGrid(rawPuzzleData)
  if (!puzzleData) return false
  
  State.level = level
  State.puzzleIndex = index
  State.puzzle = puzzleData
  
  const { rows, cols } = puzzleData
  State.grid = []
  
  for (let r = 0; r < rows; r++) {
    State.grid[r] = []
    for (let c = 0; c < cols; c++) {
      const answer = puzzleData.solution[r]?.[c]
      if (answer === null || answer === undefined) {
        State.grid[r][c] = { r, c, val: null, answer: null, isBlack: true, status: 'black', clueRefs: [] }
      } else {
        const isPrefilled = puzzleData.prefilled.some(p => p[0] === r && p[1] === c)
        State.grid[r][c] = {
          r, c,
          val: isPrefilled ? answer : '',
          answer,
          isBlack: false,
          status: isPrefilled ? 'locked' : 'empty',
          clueRefs: []
        }
      }
    }
  }
  
  // Populate clueRefs
  for (const clue of puzzleData.clues.across) {
    const cells = getWordCellsStatic(State.grid, rows, cols, clue.row, clue.col, 'across')
    for (const [r, c] of cells) {
      if (State.grid[r]?.[c]) State.grid[r][c].clueRefs.push(`${clue.num}A`)
    }
  }
  for (const clue of puzzleData.clues.down) {
    const cells = getWordCellsStatic(State.grid, rows, cols, clue.row, clue.col, 'down')
    for (const [r, c] of cells) {
      if (State.grid[r]?.[c]) State.grid[r][c].clueRefs.push(`${clue.num}D`)
    }
  }
  
  // Set initial cursor
  State.activeRow = 0
  State.activeCol = 0
  State.direction = 'across'
  
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (State.grid[r][c].status === 'empty') {
        State.activeRow = r
        State.activeCol = c
        break outer
      }
    }
  }
  
  State.layout = calculateLayout(rows, cols, { W, H, SAFE_TOP, HOME_INDICATOR, Theme })
  
  // Smart direction for initial cell
  const hasAcross = cellHasDirection(State.activeRow, State.activeCol, 'across')
  const hasDown = cellHasDirection(State.activeRow, State.activeCol, 'down')
  if (hasDown && !hasAcross) State.direction = 'down'
  
  State.startTime = Date.now()
  State.screen = 'play'
  Keyboard.calculate(State.layout.keyboardY)
  
  return true
}

function getCellNumber(r, c) {
  if (!State.puzzle) return null
  for (const cl of State.puzzle.clues.across) {
    if (cl.row === r && cl.col === c) return cl.num
  }
  for (const cl of State.puzzle.clues.down) {
    if (cl.row === r && cl.col === c) return cl.num
  }
  return null
}

function getWordCells(r, c, dir) {
  if (!State.grid) return []
  const { rows, cols } = State.puzzle
  const cells = []
  
  if (dir === 'across') {
    let start = c
    while (start > 0 && !State.grid[r][start - 1].isBlack) start--
    let end = c
    while (end < cols - 1 && !State.grid[r][end + 1].isBlack) end++
    for (let j = start; j <= end; j++) cells.push([r, j])
  } else {
    let start = r
    while (start > 0 && !State.grid[start - 1][c].isBlack) start--
    let end = r
    while (end < rows - 1 && !State.grid[end + 1][c].isBlack) end++
    for (let i = start; i <= end; i++) cells.push([i, c])
  }
  
  return cells
}

function getWordCellsStatic(grid, rows, cols, r, c, dir) {
  const cells = []
  
  if (dir === 'across') {
    let start = c
    while (start > 0 && !grid[r][start - 1].isBlack) start--
    let end = c
    while (end < cols - 1 && !grid[r][end + 1].isBlack) end++
    for (let j = start; j <= end; j++) cells.push([r, j])
  } else {
    let start = r
    while (start > 0 && !grid[start - 1][c].isBlack) start--
    let end = r
    while (end < rows - 1 && !grid[end + 1][c].isBlack) end++
    for (let i = start; i <= end; i++) cells.push([i, c])
  }
  
  return cells
}

function getCurrentClue() {
  if (!State.puzzle) return null
  const clues = State.direction === 'across' ? State.puzzle.clues.across : State.puzzle.clues.down
  const cells = getWordCells(State.activeRow, State.activeCol, State.direction)
  
  if (cells.length === 0) return null
  const [startR, startC] = cells[0]
  
  for (const clue of clues) {
    if (clue.row === startR && clue.col === startC) return clue
  }
  return null
}

// ===============================================================
// GAMEPLAY ENGINE
// ===============================================================

/**
 * Check if cell has valid word in direction
 */
function cellHasDirection(r, c, dir) {
  const grid = State.grid
  if (!grid || !grid[r]?.[c] || grid[r][c].isBlack) return false
  
  const { rows, cols } = State.puzzle
  
  if (dir === 'across') {
    const hasLeft = c > 0 && grid[r][c - 1] && !grid[r][c - 1].isBlack
    const hasRight = c < cols - 1 && grid[r][c + 1] && !grid[r][c + 1].isBlack
    return hasLeft || hasRight
  } else {
    const hasUp = r > 0 && grid[r - 1]?.[c] && !grid[r - 1][c].isBlack
    const hasDown = r < rows - 1 && grid[r + 1]?.[c] && !grid[r + 1][c].isBlack
    return hasUp || hasDown
  }
}

/**
 * Handle cell tap with smart direction switching
 */
function handleCellTap(r, c) {
  const cell = State.grid[r]?.[c]
  if (!cell || cell.isBlack) return
  
  const hasAcross = cellHasDirection(r, c, 'across')
  const hasDown = cellHasDirection(r, c, 'down')
  const isSameCell = State.activeRow === r && State.activeCol === c
  
  if (isSameCell) {
    if (hasAcross && hasDown) {
      State.direction = State.direction === 'across' ? 'down' : 'across'
    }
  } else {
    State.activeRow = r
    State.activeCol = c
    
    // Smart auto-switch
    if (hasDown && !hasAcross) {
      State.direction = 'down'
    } else if (hasAcross && !hasDown) {
      State.direction = 'across'
    }
  }
}

/**
 * Input letter with auto-skip
 */
function inputLetter(letter) {
  const cell = State.grid[State.activeRow]?.[State.activeCol]
  
  if (!cell || cell.isBlack || cell.status === 'locked') {
    // Auto-skip to next valid cell
    moveToNextCell()
    return
  }
  
  // Add vibration feedback
  try {
    wx.vibrateShort({ type: 'light' })
  } catch (e) {
    // Fail silently if vibration not supported
  }
  
  // Play tap sound
  Haptics.tap()
  
  cell.val = letter.toUpperCase()
  cell.status = 'filled'
  moveToNextCell()
  checkWinCondition()
}

function handleBackspace() {
  const cell = State.grid[State.activeRow]?.[State.activeCol]
  
  // Add vibration feedback
  try {
    wx.vibrateShort({ type: 'light' })
  } catch (e) {
    // Fail silently if vibration not supported
  }
  
  if (cell && cell.status === 'filled') {
    cell.val = ''
    cell.status = 'empty'
  } else if (cell && cell.status === 'empty') {
    const moved = moveToPrevCell()
    if (moved) {
      const prevCell = State.grid[State.activeRow]?.[State.activeCol]
      if (prevCell && prevCell.status === 'filled') {
        prevCell.val = ''
        prevCell.status = 'empty'
      }
    }
  }
}

/**
 * Move to next cell, auto-skip black/locked cells
 */
function moveToNextCell() {
  const cells = getWordCells(State.activeRow, State.activeCol, State.direction)
  const idx = cells.findIndex(([r, c]) => r === State.activeRow && c === State.activeCol)
  
  // Find next empty cell (skip locked)
  for (let i = idx + 1; i < cells.length; i++) {
    const [r, c] = cells[i]
    const nextCell = State.grid[r][c]
    if (nextCell.status === 'empty') {
      State.activeRow = r
      State.activeCol = c
      return true
    }
  }
  
  // If no empty cells, move to next non-locked cell
  for (let i = idx + 1; i < cells.length; i++) {
    const [r, c] = cells[i]
    const nextCell = State.grid[r][c]
    if (nextCell.status !== 'locked' && !nextCell.isBlack) {
      State.activeRow = r
      State.activeCol = c
      return true
    }
  }
  
  return false
}

function moveToPrevCell() {
  const cells = getWordCells(State.activeRow, State.activeCol, State.direction)
  const idx = cells.findIndex(([r, c]) => r === State.activeRow && c === State.activeCol)
  
  for (let i = idx - 1; i >= 0; i--) {
    const [r, c] = cells[i]
    const prevCell = State.grid[r][c]
    if (prevCell.status !== 'locked' && !prevCell.isBlack) {
      State.activeRow = r
      State.activeCol = c
      return true
    }
  }
  
  return false
}

function useHint() {
  if (State.hints <= 0) return
  
  const cell = State.grid[State.activeRow]?.[State.activeCol]
  if (!cell || cell.isBlack || cell.status === 'locked') return
  
  cell.val = cell.answer
  cell.status = 'locked'
  State.hints--
  saveProgress()
  
  moveToNextCell()
  checkWinCondition()
}

function checkWinCondition() {
  if (!State.grid) return false
  
  console.log('[DEBUG] checkWinCondition called')
  for (let r = 0; r < State.grid.length; r++) {
    for (let c = 0; c < State.grid[r].length; c++) {
      const cell = State.grid[r][c]
      if (!cell.isBlack && cell.status !== 'locked') {
        console.log(`[DEBUG] Cell [${r}][${c}]: val="${cell.val}" answer="${cell.answer}" match=${cell.val === cell.answer}`)
        if (cell.val !== cell.answer) return false
      }
    }
  }
  console.log('[DEBUG] WIN DETECTED!')
  
  const elapsed = Math.floor((Date.now() - State.startTime) / 1000)
  const bonus = Math.max(0, 300 - elapsed)
  const points = 100 + bonus
  
  State.score += points
  State.completed[`${State.level}_${State.puzzleIndex}`] = { time: elapsed, score: points }
  saveProgress()
  
  // Success feedback: vibration and sound
  try {
    wx.vibrateLong()
  } catch (e) {
    // Fail silently if vibration not supported
  }
  Haptics.success()
  
  wx.showToast({ title: '🎉 Puzzle Solved!', icon: 'none', duration: 2000 })
  setTimeout(() => { State.screen = 'complete' }, 500)
  
  return true
}

// ===============================================================
// KEYBOARD
// ===============================================================

const Keyboard = {
  rows: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['💡', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
  ],
  keyWidth: 0,
  keyHeight: 46,
  keyGap: 6,
  rowGap: 10,
  sidePadding: 3,
  pressedKey: null,
  layout: [],
  
  calculate(startY) {
    const totalWidth = W - this.sidePadding * 2
    this.keyWidth = Math.floor((totalWidth - this.keyGap * 9) / 10)
    this.layout = []
    let currentY = startY + 6
    
    for (const row of this.rows) {
      const rowWidth = row.length * this.keyWidth + (row.length - 1) * this.keyGap
      let x = (W - rowWidth) / 2
      
      for (const key of row) {
        this.layout.push({
          key, x, y: currentY,
          w: this.keyWidth, h: this.keyHeight,
          isSpecial: key === '⌫' || key === '💡'
        })
        x += this.keyWidth + this.keyGap
      }
      currentY += this.keyHeight + this.rowGap
    }
  },
  
  handleTap(x, y) {
    for (const k of this.layout) {
      if (x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h) {
        this.pressedKey = k.key
        
        // Play tap sound for any keyboard interaction
        Haptics.tap()
        
        if (k.key === '⌫') handleBackspace()
        else if (k.key === '💡') useHint()
        else inputLetter(k.key)
        setTimeout(() => { this.pressedKey = null }, 100)
        return true
      }
    }
    return false
  },
  
  draw(ctx, layout) {
    ctx.fillStyle = Theme.keyboardBg
    ctx.fillRect(0, layout.keyboardY, W, layout.keyboardH + layout.homeIndicatorH)
    
    for (const k of this.layout) {
      const isPressed = this.pressedKey === k.key
      
      if (!isPressed) {
        ctx.fillStyle = Theme.keyShadow
        roundRect(ctx, k.x, k.y + 1, k.w, k.h, 5)
        ctx.fill()
      }
      
      ctx.fillStyle = isPressed ? Theme.keyPressed : (k.isSpecial ? Theme.keySpecial : Theme.keyBg)
      roundRect(ctx, k.x, k.y - (isPressed ? 0 : 1), k.w, k.h, 5)
      ctx.fill()
      
      ctx.fillStyle = Theme.text
      ctx.font = Font.key
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(k.key, k.x + k.w / 2, k.y + k.h / 2 - (isPressed ? 0 : 1))
    }
    ctx.textBaseline = 'alphabetic'
  }
}

// ===============================================================
// RENDERING
// ===============================================================

// roundRect moved to js/utils.js

function render() {
  ctx.fillStyle = Theme.bg
  ctx.fillRect(0, 0, W, H)
  
  switch (State.screen) {
    case 'menu': renderMenu(); break
    case 'levels': renderLevels(); break
    case 'puzzles': renderPuzzles(); break
    case 'play': renderPlay(); break
    case 'complete': renderComplete(); break
  }
  
  requestAnimationFrame(render)
}

function renderMenu() {
  const titleY = H * 0.25
  ctx.fillStyle = Theme.text
  ctx.font = Font.title
  ctx.textAlign = 'center'
  ctx.fillText('Crossword Master', W / 2, titleY)
  
  const cardY = titleY + 50
  ctx.fillStyle = Theme.surface
  roundRect(ctx, 16, cardY, W - 32, 70, 12)
  ctx.fill()
  
  ctx.fillStyle = Theme.textTertiary
  ctx.font = Font.caption
  ctx.textAlign = 'left'
  ctx.fillText('SCORE', 32, cardY + 28)
  ctx.textAlign = 'right'
  ctx.fillText('HINTS', W - 32, cardY + 28)
  
  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'left'
  ctx.fillText(State.score.toString(), 32, cardY + 52)
  ctx.fillStyle = Theme.blue
  ctx.textAlign = 'right'
  ctx.fillText(`💡 ${State.hints}`, W - 32, cardY + 52)
  
  const btnY = cardY + 100
  ctx.fillStyle = Theme.blue
  roundRect(ctx, 16, btnY, W - 32, 52, 12)
  ctx.fill()
  
  ctx.fillStyle = Theme.textOnDark
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText('Play', W / 2, btnY + 32)
  
  UI.menuPlayBtn = { x: 16, y: btnY, w: W - 32, h: 52 }
  
  const langY = btnY + 68
  ctx.fillStyle = Theme.surface
  roundRect(ctx, 16, langY, W - 32, 48, 12)
  ctx.fill()
  
  ctx.fillStyle = Theme.textSecondary
  ctx.font = Font.body
  ctx.fillText(State.lang === 'en' ? '🇬🇧 English hints' : '🇨🇳 中文提示', W / 2, langY + 30)
  
  UI.menuLangBtn = { x: 16, y: langY, w: W - 32, h: 48 }
}

function renderLevels() {
  ctx.fillStyle = Theme.blue
  ctx.font = Font.subhead
  ctx.textAlign = 'left'
  ctx.fillText('‹ Back', 12, SAFE_TOP + 30)
  
  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText('Select Level', W / 2, SAFE_TOP + 30)
  
  UI.backBtn = { x: 0, y: SAFE_TOP, w: 80, h: 44 }
  UI.levelBtns = []
  
  const startY = SAFE_TOP + 60
  const cardH = 64
  const gap = 12
  
  Object.entries(LEVELS).forEach(([key, level], i) => {
    const y = startY + i * (cardH + gap)
    const hasPuzzles = PUZZLES[key]?.length > 0
    
    ctx.fillStyle = Theme.surface
    roundRect(ctx, 16, y, W - 32, cardH, 12)
    ctx.fill()
    
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(level.icon, 32, y + 40)
    
    ctx.fillStyle = hasPuzzles ? Theme.text : Theme.textTertiary
    ctx.font = Font.headline
    ctx.fillText(level.name, 64, y + 28)
    
    ctx.fillStyle = Theme.textTertiary
    ctx.font = Font.caption
    ctx.fillText(hasPuzzles ? `${PUZZLES[key].length} puzzles` : 'Coming soon', 64, y + 48)
    
    if (hasPuzzles) {
      ctx.fillStyle = Theme.textTertiary
      ctx.font = Font.subhead
      ctx.textAlign = 'right'
      ctx.fillText('›', W - 32, y + 38)
      UI.levelBtns.push({ key, x: 16, y, w: W - 32, h: cardH })
    }
  })
}

function renderPuzzles() {
  ctx.fillStyle = Theme.blue
  ctx.font = Font.subhead
  ctx.textAlign = 'left'
  ctx.fillText('‹ Back', 12, SAFE_TOP + 30)
  
  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText(LEVELS[State.level].name, W / 2, SAFE_TOP + 30)
  
  UI.backBtn = { x: 0, y: SAFE_TOP, w: 80, h: 44 }
  UI.puzzleBtns = []
  
  const list = PUZZLES[State.level] || []
  const startY = SAFE_TOP + 60
  const cardH = 72
  const gap = 12
  
  list.forEach((p, i) => {
    const y = startY + i * (cardH + gap)
    const key = `${State.level}_${i}`
    const done = State.completed[key]
    
    // Get dimensions from solution array
    const rows = p.solution.length
    const cols = p.solution[0]?.length || 0
    
    ctx.fillStyle = Theme.surface
    roundRect(ctx, 16, y, W - 32, cardH, 12)
    ctx.fill()
    
    if (done) {
      ctx.strokeStyle = Theme.green
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    ctx.fillStyle = done ? Theme.green : Theme.blue
    ctx.font = Font.headline
    ctx.textAlign = 'left'
    ctx.fillText(`#${p.id}`, 32, y + 28)
    
    ctx.fillStyle = Theme.text
    ctx.fillText(p.title, 64, y + 28)
    
    ctx.fillStyle = Theme.textTertiary
    ctx.font = Font.caption
    ctx.fillText(`${cols}×${rows}`, 64, y + 50)
    
    if (done) {
      ctx.fillStyle = Theme.green
      ctx.font = Font.subhead
      ctx.textAlign = 'right'
      const m = Math.floor(done.time / 60)
      const s = done.time % 60
      ctx.fillText(`✓ ${m}:${s.toString().padStart(2, '0')}`, W - 32, y + 38)
    } else {
      ctx.fillStyle = Theme.textTertiary
      ctx.font = Font.subhead
      ctx.textAlign = 'right'
      ctx.fillText('›', W - 32, y + 38)
    }
    
    UI.puzzleBtns.push({ idx: i, x: 16, y, w: W - 32, h: cardH })
  })
}

function renderPlay() {
  if (!State.puzzle || !State.layout) return
  
  const L = State.layout
  const { rows, cols } = L
  
  // Header
  ctx.fillStyle = Theme.textTertiary
  ctx.font = Font.subhead
  ctx.textAlign = 'left'
  ctx.fillText('‹ Back', 12, L.headerY + 30)
  UI.backBtn = { x: 0, y: L.headerY, w: 70, h: L.headerH }
  
  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText(State.puzzle.title, W / 2, L.headerY + 30)
  
  const elapsed = Math.floor((Date.now() - State.startTime) / 1000)
  ctx.fillStyle = Theme.textTertiary
  ctx.font = Font.subhead
  ctx.textAlign = 'right'
  ctx.fillText(`${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`, W - 12, L.headerY + 30)
  
  // Grid
  const wordCells = getWordCells(State.activeRow, State.activeCol, State.direction)
  
  // Outer black frame
  ctx.fillStyle = Theme.gridOuterBorder
  ctx.fillRect(L.gridX, L.gridY, L.gridWidth, L.gridHeight)
  
  // Grey inner area (grid lines)
  ctx.fillStyle = Theme.gridLineColor
  ctx.fillRect(L.innerX, L.innerY, L.gridWidth - L.border * 2, L.gridHeight - L.border * 2)
  
  // Cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = State.grid[r]?.[c]
      if (!cell) continue
      
      const cellX = L.innerX + c * (L.cellSize + L.gap)
      const cellY = L.innerY + r * (L.cellSize + L.gap)
      
      if (cell.isBlack) {
        ctx.fillStyle = Theme.cellBlack
        ctx.fillRect(cellX, cellY, L.cellSize, L.cellSize)
        continue
      }
      
      const isActive = State.activeRow === r && State.activeCol === c
      const inWord = wordCells.some(([wr, wc]) => wr === r && wc === c)
      
      ctx.fillStyle = isActive ? Theme.cellActive : (inWord ? Theme.cellActiveWord : Theme.cellBg)
      ctx.fillRect(cellX, cellY, L.cellSize, L.cellSize)
      
      const num = getCellNumber(r, c)
      if (num) {
        ctx.fillStyle = Theme.text
        ctx.font = Font.gridNumber()
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(num.toString(), cellX + 2, cellY + 1)
      }
      
      if (cell.val) {
        ctx.fillStyle = Theme.text
        ctx.font = Font.gridLetter(L.cellSize)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(cell.val, cellX + L.cellSize / 2, cellY + L.cellSize / 2 + 2)
      }
    }
  }
  ctx.textBaseline = 'alphabetic'
  
  // Progress Bar
  const progressBarY = L.gridY + L.gridHeight + 16
  const progressBarHeight = 12
  const progressBarPadding = 32
  const progressBarWidth = W - progressBarPadding * 2
  
  // Count filled vs total cells
  let filledCells = 0
  let totalCells = 0
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = State.grid[r]?.[c]
      if (cell && !cell.isBlack) {
        totalCells++
        if (cell.val && cell.val.trim() !== '') {
          filledCells++
        }
      }
    }
  }
  
  const progress = totalCells > 0 ? filledCells / totalCells : 0
  
  // Background (rounded corners)
  ctx.fillStyle = Theme.clueBarBg
  roundRect(ctx, progressBarPadding, progressBarY, progressBarWidth, progressBarHeight, 6)
  ctx.fill()
  
  // Progress fill (rounded corners)
  if (progress > 0) {
    ctx.fillStyle = Theme.blue
    const fillWidth = progressBarWidth * progress
    roundRect(ctx, progressBarPadding, progressBarY, fillWidth, progressBarHeight, 6)
    ctx.fill()
  }
  
  // Progress text
  ctx.fillStyle = Theme.textTertiary
  ctx.font = Font.caption
  ctx.textAlign = 'center'
  const percentage = Math.round(progress * 100)
  ctx.fillText(`${percentage}% Complete (${filledCells}/${totalCells})`, W / 2, progressBarY + progressBarHeight + 16)
  
  // Clue bar
  ctx.fillStyle = Theme.clueBarBg
  ctx.fillRect(0, L.clueY, W, L.clueH)
  
  ctx.strokeStyle = Theme.clueBarBorder
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, L.clueY)
  ctx.lineTo(W, L.clueY)
  ctx.stroke()
  
  const clue = getCurrentClue()
  if (clue) {
    ctx.fillStyle = Theme.blue
    ctx.font = Font.caption
    ctx.textAlign = 'left'
    ctx.fillText(`${clue.num} ${State.direction.toUpperCase()}`, 16, L.clueY + 18)
    
    ctx.fillStyle = Theme.text
    ctx.font = Font.body
    ctx.fillText(State.lang === 'en' ? clue.text : clue.textZh, 16, L.clueY + 38)
  } else {
    ctx.fillStyle = Theme.textTertiary
    ctx.font = Font.body
    ctx.textAlign = 'left'
    ctx.fillText('Tap a cell to see clue', 16, L.clueY + 30)
  }
  
  ctx.fillStyle = Theme.orange
  ctx.font = Font.subhead
  ctx.textAlign = 'right'
  ctx.fillText(`💡 ${State.hints}`, W - 16, L.clueY + 32)
  
  // Keyboard
  Keyboard.draw(ctx, L)
}

function renderComplete() {
  ctx.fillStyle = Theme.bg
  ctx.fillRect(0, 0, W, H)
  
  ctx.font = '56px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🎉', W / 2, H * 0.2)
  
  ctx.fillStyle = Theme.text
  ctx.font = Font.title
  ctx.fillText('Complete!', W / 2, H * 0.2 + 50)
  
  const cardY = H * 0.35
  const key = `${State.level}_${State.puzzleIndex}`
  const result = State.completed[key] || { time: 0, score: 100 }
  
  ctx.fillStyle = Theme.surface
  roundRect(ctx, 16, cardY, W - 32, 100, 12)
  ctx.fill()
  
  const m = Math.floor(result.time / 60)
  const s = result.time % 60
  
  ctx.fillStyle = Theme.textTertiary
  ctx.font = Font.caption
  ctx.textAlign = 'left'
  ctx.fillText('TIME', 32, cardY + 30)
  ctx.fillText('SCORE', 32, cardY + 70)
  
  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'right'
  ctx.fillText(`${m}:${s.toString().padStart(2, '0')}`, W - 32, cardY + 30)
  ctx.fillStyle = Theme.green
  ctx.fillText(`+${result.score}`, W - 32, cardY + 70)
  
  const btnY = cardY + 130
  ctx.fillStyle = Theme.blue
  roundRect(ctx, 16, btnY, W - 32, 52, 12)
  ctx.fill()
  
  ctx.fillStyle = Theme.textOnDark
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText('Next Puzzle', W / 2, btnY + 32)
  
  UI.completeNextBtn = { x: 16, y: btnY, w: W - 32, h: 52 }
  
  const menuY = btnY + 68
  ctx.fillStyle = Theme.surface
  roundRect(ctx, 16, menuY, W - 32, 48, 12)
  ctx.fill()
  
  ctx.fillStyle = Theme.textSecondary
  ctx.fillText('Back to Menu', W / 2, menuY + 30)
  
  UI.completeMenuBtn = { x: 16, y: menuY, w: W - 32, h: 48 }
}

// ===============================================================
// UI & INPUT
// ===============================================================

const UI = {
  menuPlayBtn: null,
  menuLangBtn: null,
  backBtn: null,
  levelBtns: [],
  puzzleBtns: [],
  completeNextBtn: null,
  completeMenuBtn: null
}

// inRect moved to js/utils.js

function handleTouch(x, y) {
  switch (State.screen) {
    case 'menu':
      if (inRect(x, y, UI.menuPlayBtn)) State.screen = 'levels'
      else if (inRect(x, y, UI.menuLangBtn)) {
        State.lang = State.lang === 'en' ? 'zh' : 'en'
        saveProgress()
      }
      break
      
    case 'levels':
      if (inRect(x, y, UI.backBtn)) State.screen = 'menu'
      else {
        for (const btn of UI.levelBtns) {
          if (inRect(x, y, btn)) {
            State.level = btn.key
            State.screen = 'puzzles'
            break
          }
        }
      }
      break
      
    case 'puzzles':
      if (inRect(x, y, UI.backBtn)) State.screen = 'levels'
      else {
        for (const btn of UI.puzzleBtns) {
          if (inRect(x, y, btn)) {
            initPuzzle(State.level, btn.idx)
            break
          }
        }
      }
      break
      
    case 'play':
      if (inRect(x, y, UI.backBtn)) {
        State.screen = 'puzzles'
        return
      }
      
      const L = State.layout
      
      if (y >= L.keyboardY) {
        Keyboard.handleTap(x, y)
        return
      }
      
      // Grid tap
      const { rows, cols } = L
      if (x >= L.gridX && x < L.gridX + L.gridWidth &&
          y >= L.gridY && y < L.gridY + L.gridHeight) {
        const relX = x - L.innerX
        const relY = y - L.innerY
        const cellWithGap = L.cellSize + L.gap
        const col = Math.floor(relX / cellWithGap)
        const row = Math.floor(relY / cellWithGap)
        
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          handleCellTap(row, col)
        }
      }
      break
      
    case 'complete':
      if (inRect(x, y, UI.completeNextBtn)) {
        const list = PUZZLES[State.level]
        if (list && State.puzzleIndex + 1 < list.length) {
          initPuzzle(State.level, State.puzzleIndex + 1)
        } else {
          State.screen = 'puzzles'
        }
      } else if (inRect(x, y, UI.completeMenuBtn)) {
        State.screen = 'menu'
      }
      break
  }
}

wx.onTouchEnd(e => {
  const touch = e.changedTouches[0]
  if (touch) handleTouch(touch.clientX, touch.clientY)
})

// ===============================================================
// INIT
// ===============================================================

loadProgress()
// Haptics needs no init
render()
