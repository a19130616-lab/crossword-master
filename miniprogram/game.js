const { Theme, Font } = require('./js/theme')
const { inRect } = require('./js/utils')
const { State, loadProgress, saveProgress, loadPuzzlesIndex } = require('./js/state')
const { calculateLayout } = require('./js/layout')
const { createEngine } = require('./js/puzzle_engine')
const { render } = require('./js/renderer')

const DIFFICULTIES = [
  { key: 'easy', name: 'Easy' },
  { key: 'medium', name: 'Medium' },
  { key: 'hard', name: 'Hard' }
]

const sys = wx.getSystemInfoSync()
const W = sys.windowWidth
const H = sys.windowHeight
const safeArea = sys.safeArea || { top: 0, bottom: H }
const STATUS_BAR = sys.statusBarHeight || 20
const SAFE_TOP = Math.max(STATUS_BAR, safeArea.top || 0)
const SAFE_BOTTOM = H - (safeArea.bottom || H)
const HOME_INDICATOR = Math.max(SAFE_BOTTOM, 34)

const dpr = sys.pixelRatio || 2
const canvas = wx.createCanvas()
canvas.width = W * dpr
canvas.height = H * dpr
const ctx = canvas.getContext('2d')
ctx.scale(dpr, dpr)

const Haptics = {
  tap() { try { wx.vibrateShort({ type: 'light' }) } catch (e) {} },
  success() { try { wx.vibrateLong() } catch (e) {} },
  error() { try { wx.vibrateShort({ type: 'heavy' }) } catch (e) {} }
}

const engine = createEngine({ State, Theme, calculateLayout, W, H, SAFE_TOP, HOME_INDICATOR, saveProgress, Haptics })
const UI = { menuPlayBtn: null, menuLangBtn: null, backBtn: null, levelBtns: [], puzzleBtns: [], completeNextBtn: null, completeMenuBtn: null }

function loadPuzzleByIndex(idx) {
  const entry = State.puzzlesIndex[idx]
  if (!entry) return null
  try {
    const fs = wx.getFileSystemManager()
    const raw = fs.readFileSync(entry.file, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

function handleTouch(x, y) {
  switch (State.screen) {
    case 'menu':
      if (inRect(x, y, UI.menuPlayBtn)) State.screen = 'levels'
      else if (inRect(x, y, UI.menuLangBtn)) { State.lang = State.lang === 'en' ? 'zh' : 'en'; saveProgress() }
      break
    case 'levels':
      if (inRect(x, y, UI.backBtn)) State.screen = 'menu'
      else for (const btn of UI.levelBtns) if (inRect(x, y, btn)) { State.difficulty = btn.key; saveProgress(); State.puzzleScrollY = 0; State.screen = 'puzzles'; break }
      break
    case 'puzzles':
      if (inRect(x, y, UI.backBtn)) State.screen = 'levels'
      else for (const btn of UI.puzzleBtns) if (inRect(x, y, btn)) { const puzzle = loadPuzzleByIndex(btn.idx); if (puzzle) engine.initPuzzle(puzzle, btn.idx); break }
      break
    case 'play': {
      if (inRect(x, y, UI.backBtn)) { State.screen = 'puzzles'; return }
      const L = State.layout
      if (y >= L.keyboardY) { engine.Keyboard.handleTap(x, y); return }
      if (x >= L.gridX && x < L.gridX + L.gridWidth && y >= L.gridY && y < L.gridY + L.gridHeight) {
        const relX = x - L.innerX
        const relY = y - L.innerY
        const cellWithGap = L.cellSize + L.gap
        const col = Math.floor(relX / cellWithGap)
        const row = Math.floor(relY / cellWithGap)
        if (row >= 0 && row < L.rows && col >= 0 && col < L.cols) engine.handleCellTap(row, col)
      }
      break
    }
    case 'complete':
      if (inRect(x, y, UI.completeNextBtn)) {
        const nextIdx = State.puzzleIndex + 1
        if (State.puzzlesIndex && nextIdx < State.puzzlesIndex.length) {
          const puzzle = loadPuzzleByIndex(nextIdx)
          if (puzzle) engine.initPuzzle(puzzle, nextIdx)
          else State.screen = 'puzzles'
        } else {
          State.screen = 'puzzles'
        }
      } else if (inRect(x, y, UI.completeMenuBtn)) State.screen = 'menu'
      break
  }
}

wx.onTouchEnd(e => {
  const t = e.changedTouches[0]
  if (!t) return
  if (didScroll) { didScroll = false; return }
  handleTouch(t.clientX, t.clientY)
})

let touchStartY = 0
let touchStartScrollY = 0
let didScroll = false

wx.onTouchStart(e => {
  const t = e.touches[0]
  if (t && State.screen === 'puzzles') {
    touchStartY = t.clientY
    touchStartScrollY = State.puzzleScrollY || 0
    didScroll = false
  }
})

wx.onTouchMove(e => {
  const t = e.touches[0]
  if (t && State.screen === 'puzzles') {
    const dy = touchStartY - t.clientY
    if (Math.abs(dy) > 5) didScroll = true
    State.puzzleScrollY = Math.max(0, touchStartScrollY + dy)
  }
})

function loop() {
  render(ctx, { State, Theme, Font, W, H, SAFE_TOP, DIFFICULTIES, UI, Keyboard: engine.Keyboard, getWordCells: engine.getWordCells, getCellNumber: engine.getCellNumber, getCurrentClue: engine.getCurrentClue })
  requestAnimationFrame(loop)
}

loadProgress()
loadPuzzlesIndex()
loop()
