// Canvas rendering for Crossword Master

const { roundRect } = require('./utils')

function render(ctx, deps) {
  const { State } = deps

  ctx.fillStyle = deps.Theme.bg
  ctx.fillRect(0, 0, deps.W, deps.H)

  switch (State.screen) {
    case 'menu': renderMenu(ctx, deps); break
    case 'levels': renderLevels(ctx, deps); break
    case 'puzzles': renderPuzzles(ctx, deps); break
    case 'play': renderPlay(ctx, deps); break
    case 'complete': renderComplete(ctx, deps); break
  }
}

function renderMenu(ctx, deps) {
  const { State, Theme, Font, W, H, UI } = deps

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
  ctx.fillText(State.lang === 'en' ? 'EN  English hints' : 'ZH  中文提示', W / 2, langY + 30)

  UI.menuLangBtn = { x: 16, y: langY, w: W - 32, h: 48 }
}

function renderLevels(ctx, deps) {
  const { State, DIFFICULTIES, Theme, Font, W, SAFE_TOP, UI } = deps

  ctx.fillStyle = Theme.blue
  ctx.font = Font.subhead
  ctx.textAlign = 'left'
  ctx.fillText('‹ Back', 12, SAFE_TOP + 30)

  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText('Select Difficulty', W / 2, SAFE_TOP + 30)

  UI.backBtn = { x: 0, y: SAFE_TOP, w: 80, h: 44 }
  UI.levelBtns = []

  const startY = SAFE_TOP + 60
  const cardH = 64
  const gap = 12

  DIFFICULTIES.forEach((level, i) => {
    const y = startY + i * (cardH + gap)

    ctx.fillStyle = Theme.surface
    roundRect(ctx, 16, y, W - 32, cardH, 12)
    ctx.fill()

    ctx.fillStyle = Theme.text
    ctx.font = Font.headline
    ctx.textAlign = 'left'
    ctx.fillText(level.name, 32, y + 28)

    ctx.fillStyle = Theme.textTertiary
    ctx.font = Font.caption
    ctx.fillText(State.difficulty === level.key ? 'Selected' : 'Tap to choose', 32, y + 48)

    ctx.fillStyle = Theme.textTertiary
    ctx.font = Font.subhead
    ctx.textAlign = 'right'
    ctx.fillText('›', W - 32, y + 38)

    UI.levelBtns.push({ key: level.key, x: 16, y, w: W - 32, h: cardH })
  })
}

function renderPuzzles(ctx, deps) {
  const { State, Theme, Font, W, SAFE_TOP, UI } = deps

  ctx.fillStyle = Theme.blue
  ctx.font = Font.subhead
  ctx.textAlign = 'left'
  ctx.fillText('‹ Back', 12, SAFE_TOP + 30)

  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText('Select Puzzle', W / 2, SAFE_TOP + 30)

  UI.backBtn = { x: 0, y: SAFE_TOP, w: 80, h: 44 }
  UI.puzzleBtns = []

  const allList = State.puzzlesIndex || []
  const filtered = allList.filter(p => p.difficulty === State.difficulty)
  const startY = SAFE_TOP + 60
  const cardH = 72
  const gap = 12
  const scrollY = State.puzzleScrollY || 0

  filtered.forEach((p, i) => {
    const globalIdx = allList.indexOf(p)
    const y = startY + i * (cardH + gap) - scrollY
    const key = p.id || `puzzle_${globalIdx + 1}`
    const done = State.completed[key]

    if (y + cardH < SAFE_TOP || y > deps.H) return

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
    ctx.fillText(`#${i + 1}`, 32, y + 28)

    ctx.fillStyle = Theme.text
    ctx.fillText(p.title || `Puzzle ${i + 1}`, 64, y + 28)

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

    UI.puzzleBtns.push({ idx: globalIdx, x: 16, y, w: W - 32, h: cardH })
  })
}

function renderPlay(ctx, deps) {
  const { State, Theme, Font, W, SAFE_TOP, UI, Keyboard, getWordCells, getCellNumber, getCurrentClue } = deps
  if (!State.puzzle || !State.layout) return

  const L = State.layout
  const { rows, cols } = L

  // Header: back, title, check button, timer
  ctx.fillStyle = Theme.textTertiary
  ctx.font = Font.subhead
  ctx.textAlign = 'left'
  ctx.fillText('‹ Back', 12, L.headerY + 30)
  UI.backBtn = { x: 0, y: L.headerY, w: 70, h: L.headerH }

  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText(State.puzzle.title, W / 2, L.headerY + 30)

  // Check button
  const checkFlash = State.checkTime && (Date.now() - State.checkTime < 800)
  const hasErrors = State.errorCells.length > 0
  ctx.fillStyle = checkFlash ? (hasErrors ? '#EF5350' : Theme.green) : Theme.blue
  ctx.font = Font.headline
  ctx.textAlign = 'right'
  ctx.fillText('Check', W - 48, L.headerY + 30)
  UI.checkBtn = { x: W - 96, y: L.headerY, w: 84, h: L.headerH }

  // Timer
  const elapsed = Math.floor((Date.now() - State.startTime) / 1000)
  ctx.fillStyle = Theme.textTertiary
  ctx.font = Font.caption
  ctx.textAlign = 'right'
  ctx.fillText(`${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`, W - 12, L.headerY + 18)

  const wordCells = getWordCells(State.activeRow, State.activeCol, State.direction)

  ctx.fillStyle = Theme.gridOuterBorder
  ctx.fillRect(L.gridX, L.gridY, L.gridWidth, L.gridHeight)

  ctx.fillStyle = Theme.gridLineColor
  ctx.fillRect(L.innerX, L.innerY, L.gridWidth - L.border * 2, L.gridHeight - L.border * 2)

  const now = Date.now()

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

      // Hint flash (400ms)
      const isHintFlash = State.hintFlashCell
        && State.hintFlashCell.r === r
        && State.hintFlashCell.c === c
        && (now - State.hintFlashCell.time < 400)

      // Error flash (800ms)
      const isError = State.errorCells.length > 0
        && State.errorCells.some(e => e.r === r && e.c === c)
        && (now - State.checkTime < 800)

      ctx.fillStyle = isError     ? Theme.cellError
                    : isHintFlash ? Theme.cellHintFlash
                    : isActive    ? Theme.cellActive
                    : inWord      ? Theme.cellActiveWord
                    : Theme.cellBg
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
        ctx.fillStyle = isError ? '#EF5350' : Theme.text
        ctx.font = Font.gridLetter(L.cellSize)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(cell.val).toUpperCase(), cellX + L.cellSize / 2, cellY + L.cellSize / 2 + 2)
      }
    }
  }
  ctx.textBaseline = 'alphabetic'

  const progressBarY = L.gridY + L.gridHeight + 16
  const progressBarHeight = 12
  const progressBarPadding = 32
  const progressBarWidth = W - progressBarPadding * 2

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

  ctx.fillStyle = Theme.clueBarBg
  roundRect(ctx, progressBarPadding, progressBarY, progressBarWidth, progressBarHeight, 6)
  ctx.fill()

  if (progress > 0) {
    ctx.fillStyle = Theme.blue
    const fillWidth = progressBarWidth * progress
    roundRect(ctx, progressBarPadding, progressBarY, fillWidth, progressBarHeight, 6)
    ctx.fill()
  }

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
    // Clue number
    ctx.fillStyle = Theme.blue
    ctx.font = Font.caption
    ctx.textAlign = 'left'
    ctx.fillText(`${clue.num}`, 16, L.clueY + 18)

    // Direction pill
    const dirLabel = State.direction === 'across' ? 'ACROSS \u2192' : 'DOWN \u2193'
    ctx.font = Font.caption
    const numWidth = ctx.measureText(`${clue.num} `).width
    const dirPillX = 16 + numWidth
    const dirPillW = ctx.measureText(dirLabel).width + 14
    const dirPillH = 20
    const dirPillY = L.clueY + 6

    const dirFlash = State.directionToggleTime && (now - State.directionToggleTime < 300)
    ctx.fillStyle = dirFlash ? Theme.orange : Theme.blue
    roundRect(ctx, dirPillX, dirPillY, dirPillW, dirPillH, 10)
    ctx.fill()

    ctx.fillStyle = Theme.textOnDark
    ctx.font = Font.caption
    ctx.textAlign = 'center'
    ctx.fillText(dirLabel, dirPillX + dirPillW / 2, dirPillY + 14)

    UI.dirToggleBtn = { x: dirPillX, y: dirPillY, w: dirPillW, h: dirPillH }

    // Clue text
    const clueText = clue.clue ? (State.lang === 'en' ? clue.clue.en : clue.clue.zh) : (State.lang === 'en' ? clue.text : clue.textZh)

    ctx.fillStyle = Theme.text
    ctx.font = Font.body
    ctx.textAlign = 'left'
    const maxWidth = W - 32
    const lineHeight = 18
    const lines = wrapText(ctx, clueText || '', maxWidth)
    for (let i = 0; i < lines.length && i < 3; i++) {
      ctx.fillText(lines[i], 16, L.clueY + 40 + i * lineHeight)
    }
  } else {
    UI.dirToggleBtn = null
    const fallback = (State.grid && !State.grid[State.activeRow]?.[State.activeCol]?.isBlack)
    if (!fallback) {
      ctx.fillStyle = Theme.textTertiary
      ctx.font = Font.body
      ctx.textAlign = 'left'
      ctx.fillText('Tap a cell to see clue', 16, L.clueY + 45)
    }
  }

  // Hint count in clue bar
  ctx.fillStyle = Theme.orange
  ctx.font = Font.subhead
  ctx.textAlign = 'right'
  ctx.fillText(`💡 ${State.hints}`, W - 16, L.clueY + 18)

  // Clue bar tap area (for opening clue list) — left portion, excluding hint area
  UI.clueBarBtn = { x: 0, y: L.clueY, w: W - 70, h: L.clueH }

  drawKeyboard(ctx, { Theme, Font, W, Keyboard, L, State })

  // Clue list overlay
  if (State.showClueList) renderClueList(ctx, deps)
}

function drawKeyboard(ctx, deps) {
  const { Theme, Font, W, Keyboard, L, State } = deps

  ctx.fillStyle = Theme.keyboardBg
  ctx.fillRect(0, L.keyboardY, W, L.keyboardH + L.homeIndicatorH)

  for (const k of Keyboard.layout) {
    const isPressed = Keyboard.pressedKey === k.key
    const isHintDimmed = k.key === '💡' && State.hints <= 0

    if (isHintDimmed) ctx.globalAlpha = 0.3

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

    if (isHintDimmed) ctx.globalAlpha = 1.0
  }
  ctx.textBaseline = 'alphabetic'
}

function renderComplete(ctx, deps) {
  const { State, Theme, Font, W, H, UI } = deps

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

function renderClueList(ctx, deps) {
  const { State, Theme, Font, W, H, UI } = deps

  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(0, 0, W, H)

  // White panel
  const panelPad = 16
  const panelY = H * 0.08
  const panelH = H * 0.84
  const panelW = W - panelPad * 2

  ctx.fillStyle = Theme.surface
  roundRect(ctx, panelPad, panelY, panelW, panelH, 16)
  ctx.fill()

  // Title
  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText('All Clues', W / 2, panelY + 30)

  // Close button
  ctx.fillStyle = Theme.textTertiary
  ctx.font = Font.headline
  ctx.textAlign = 'right'
  ctx.fillText('\u2715', panelPad + panelW - 12, panelY + 30)
  UI.clueListCloseBtn = { x: panelPad + panelW - 40, y: panelY, w: 40, h: 44 }

  // Clue content with clipping
  ctx.save()
  ctx.beginPath()
  ctx.rect(panelPad, panelY + 44, panelW, panelH - 44)
  ctx.clip()

  const scrollY = State.clueListScrollY || 0
  let y = panelY + 60 - scrollY
  const lineH = 32
  const contentX = panelPad + 12

  UI.clueListItems = []

  // ACROSS section
  ctx.fillStyle = Theme.blue
  ctx.font = Font.caption
  ctx.textAlign = 'left'
  ctx.fillText('ACROSS', contentX, y)
  y += 22

  for (const clue of State.puzzle.clues.across) {
    const completed = deps.isClueCompleted ? deps.isClueCompleted(clue, 'across') : false
    const clueText = clue.clue
      ? (State.lang === 'en' ? clue.clue.en : clue.clue.zh)
      : (State.lang === 'en' ? clue.text : clue.textZh)

    ctx.fillStyle = completed ? Theme.green : Theme.text
    ctx.font = Font.body
    ctx.textAlign = 'left'
    const prefix = completed ? '\u2713 ' : ''
    const displayText = `${prefix}${clue.num}. ${clueText || ''}`
    ctx.fillText(displayText, contentX, y, panelW - 24)

    UI.clueListItems.push({ clue, direction: 'across', x: panelPad, y: y - 16, w: panelW, h: lineH })
    y += lineH
  }

  // DOWN section
  y += 10
  ctx.fillStyle = Theme.blue
  ctx.font = Font.caption
  ctx.fillText('DOWN', contentX, y)
  y += 22

  for (const clue of State.puzzle.clues.down) {
    const completed = deps.isClueCompleted ? deps.isClueCompleted(clue, 'down') : false
    const clueText = clue.clue
      ? (State.lang === 'en' ? clue.clue.en : clue.clue.zh)
      : (State.lang === 'en' ? clue.text : clue.textZh)

    ctx.fillStyle = completed ? Theme.green : Theme.text
    ctx.font = Font.body
    ctx.textAlign = 'left'
    const prefix = completed ? '\u2713 ' : ''
    const displayText = `${prefix}${clue.num}. ${clueText || ''}`
    ctx.fillText(displayText, contentX, y, panelW - 24)

    UI.clueListItems.push({ clue, direction: 'down', x: panelPad, y: y - 16, w: panelW, h: lineH })
    y += lineH
  }

  UI.clueListContentH = (y + scrollY) - (panelY + 60)
  UI.clueListPanel = { x: panelPad, y: panelY, w: panelW, h: panelH }

  ctx.restore()
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return []
  const lines = []
  let line = ''

  // Split by spaces; for long tokens, fall back to per-char wrapping
  const tokens = text.split(' ')
  for (const token of tokens) {
    const test = line ? line + ' ' + token : token
    if (ctx.measureText(test).width <= maxWidth) {
      line = test
      continue
    }

    if (line) {
      lines.push(line)
      line = ''
    }

    // If token itself is too long, wrap by characters
    if (ctx.measureText(token).width > maxWidth) {
      let part = ''
      for (const ch of token) {
        const t = part + ch
        if (ctx.measureText(t).width > maxWidth && part) {
          lines.push(part)
          part = ch
        } else {
          part = t
        }
      }
      line = part
    } else {
      line = token
    }
  }

  if (line) lines.push(line)
  return lines
}

module.exports = { render, renderMenu, renderLevels, renderPuzzles, renderPlay, renderComplete, renderClueList, drawKeyboard }
