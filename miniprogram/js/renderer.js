// Canvas rendering for Crossword Master

const { roundRect } = require('./utils')
const { t } = require('./i18n')

function render(ctx, deps) {
  const { State } = deps

  ctx.fillStyle = deps.Theme.bg
  ctx.fillRect(0, 0, deps.W, deps.H)

  switch (State.screen) {
    case 'menu': renderMenu(ctx, deps); break
    case 'exams': renderExams(ctx, deps); break
    case 'levels': renderLevels(ctx, deps); break
    case 'puzzles': renderPuzzles(ctx, deps); break
    case 'play': renderPlay(ctx, deps); break
    case 'complete': renderComplete(ctx, deps); break
  }

  // Tutorial overlay (drawn on top of play screen)
  if (State.screen === 'play' && State.tutorialStep !== null && State.tutorialStep >= 0) {
    renderTutorial(ctx, deps)
  }
}

function renderMenu(ctx, deps) {
  const { State, Theme, Font, W, H, UI } = deps
  const lang = State.lang

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
  ctx.fillText(t('score', lang), 32, cardY + 28)
  ctx.textAlign = 'right'
  ctx.fillText(t('hints', lang), W - 32, cardY + 28)

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
  ctx.fillText(t('play', lang), W / 2, btnY + 32)

  UI.menuPlayBtn = { x: 16, y: btnY, w: W - 32, h: 52 }

  const langY = btnY + 68
  ctx.fillStyle = Theme.surface
  roundRect(ctx, 16, langY, W - 32, 48, 12)
  ctx.fill()

  ctx.fillStyle = Theme.textSecondary
  ctx.font = Font.body
  ctx.fillText(lang === 'en' ? t('langHintEN', lang) : t('langHintZH', lang), W / 2, langY + 30)

  UI.menuLangBtn = { x: 16, y: langY, w: W - 32, h: 48 }
}

function renderExams(ctx, deps) {
  const { State, Theme, Font, W, H, SAFE_TOP, UI } = deps
  const lang = State.lang

  ctx.fillStyle = Theme.blue
  ctx.font = Font.subhead
  ctx.textAlign = 'left'
  ctx.fillText(t('back', lang), 12, SAFE_TOP + 30)

  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText(t('selectVocabLevel', lang), W / 2, SAFE_TOP + 30)

  UI.backBtn = { x: 0, y: SAFE_TOP, w: 80, h: 44 }
  UI.examBtns = []

  const exams = State.exams || []
  const startY = SAFE_TOP + 60
  const cardH = 64
  const gap = 12
  const scrollY = State.puzzleScrollY || 0

  exams.forEach((exam, i) => {
    const y = startY + i * (cardH + gap) - scrollY

    if (y + cardH < SAFE_TOP || y > H) return

    const isSelected = State.exam === exam.key

    ctx.fillStyle = isSelected ? Theme.blue : Theme.surface
    roundRect(ctx, 16, y, W - 32, cardH, 12)
    ctx.fill()

    ctx.fillStyle = isSelected ? Theme.textOnDark : Theme.text
    ctx.font = Font.headline
    ctx.textAlign = 'left'
    const examDisplayLabel = lang === 'en' ? (exam.label_en || exam.label) : exam.label
    ctx.fillText(examDisplayLabel, 32, y + 28)

    // Show puzzle count for this exam
    const examPuzzles = (State.puzzlesIndex || []).filter(p => p.exam === exam.key)
    const examDone = examPuzzles.filter(p => State.completed[p.id]).length

    ctx.fillStyle = isSelected ? Theme.textOnDark : Theme.textTertiary
    ctx.font = Font.caption
    ctx.fillText(`${examDone}/${examPuzzles.length} ${t('completed', lang)}`, 32, y + 48)

    ctx.fillStyle = isSelected ? Theme.textOnDark : Theme.textTertiary
    ctx.font = Font.subhead
    ctx.textAlign = 'right'
    ctx.fillText('›', W - 32, y + 38)

    UI.examBtns.push({ key: exam.key, x: 16, y, w: W - 32, h: cardH })
  })
}

function renderLevels(ctx, deps) {
  const { State, DIFFICULTIES, Theme, Font, W, SAFE_TOP, UI } = deps
  const lang = State.lang

  ctx.fillStyle = Theme.blue
  ctx.font = Font.subhead
  ctx.textAlign = 'left'
  ctx.fillText(t('back', lang), 12, SAFE_TOP + 30)

  // Show current exam in the title
  const examObj = (State.exams || []).find(e => e.key === State.exam)
  const titleText = examObj
    ? (lang === 'en' ? (examObj.label_en || examObj.label) : examObj.label)
    : t('selectDifficulty', lang)

  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText(titleText, W / 2, SAFE_TOP + 30)

  UI.backBtn = { x: 0, y: SAFE_TOP, w: 80, h: 44 }
  UI.levelBtns = []

  const startY = SAFE_TOP + 60
  const cardH = 64
  const gap = 12

  const difficultyNames = {
    easy: t('difficultyEasy', lang),
    medium: t('difficultyMedium', lang),
    hard: t('difficultyHard', lang)
  }

  DIFFICULTIES.forEach((level, i) => {
    const y = startY + i * (cardH + gap)

    // Count puzzles for this exam + difficulty combo
    const allList = State.puzzlesIndex || []
    const filtered = allList.filter(p => p.exam === State.exam && p.difficulty === level.key)
    const done = filtered.filter(p => State.completed[p.id]).length

    ctx.fillStyle = Theme.surface
    roundRect(ctx, 16, y, W - 32, cardH, 12)
    ctx.fill()

    ctx.fillStyle = Theme.text
    ctx.font = Font.headline
    ctx.textAlign = 'left'
    ctx.fillText(difficultyNames[level.key] || level.name, 32, y + 28)

    ctx.fillStyle = Theme.textTertiary
    ctx.font = Font.caption
    ctx.fillText(`${done}/${filtered.length} ${t('completed', lang)}`, 32, y + 48)

    ctx.fillStyle = Theme.textTertiary
    ctx.font = Font.subhead
    ctx.textAlign = 'right'
    ctx.fillText('›', W - 32, y + 38)

    UI.levelBtns.push({ key: level.key, x: 16, y, w: W - 32, h: cardH })
  })
}

function renderPuzzles(ctx, deps) {
  const { State, Theme, Font, W, SAFE_TOP, UI } = deps
  const lang = State.lang

  ctx.fillStyle = Theme.blue
  ctx.font = Font.subhead
  ctx.textAlign = 'left'
  ctx.fillText(t('back', lang), 12, SAFE_TOP + 30)

  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText(t('selectPuzzle', lang), W / 2, SAFE_TOP + 30)

  UI.backBtn = { x: 0, y: SAFE_TOP, w: 80, h: 44 }
  UI.puzzleBtns = []

  const allList = State.puzzlesIndex || []
  const filtered = allList.filter(p => p.exam === State.exam && p.difficulty === State.difficulty)
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
  const lang = State.lang
  if (!State.puzzle || !State.layout) return

  const L = State.layout
  const { rows, cols } = L

  ctx.fillStyle = Theme.textTertiary
  ctx.font = Font.subhead
  ctx.textAlign = 'left'
  ctx.fillText(t('back', lang), 12, L.headerY + 30)
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

  const wordCells = getWordCells(State.activeRow, State.activeCol, State.direction)

  // Build set of wrong cells for highlighting
  const wrongSet = new Set()
  if (State.wrongCells && State.wrongCellsTime) {
    const age = Date.now() - State.wrongCellsTime
    if (age < 1500) {
      for (const [wr, wc] of State.wrongCells) wrongSet.add(`${wr},${wc}`)
    } else {
      State.wrongCells = null
      State.wrongCellsTime = 0
    }
  }

  ctx.fillStyle = Theme.gridOuterBorder
  ctx.fillRect(L.gridX, L.gridY, L.gridWidth, L.gridHeight)

  ctx.fillStyle = Theme.gridLineColor
  ctx.fillRect(L.innerX, L.innerY, L.gridWidth - L.border * 2, L.gridHeight - L.border * 2)

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
      const isWrong = wrongSet.has(`${r},${c}`)

      if (isWrong) {
        ctx.fillStyle = Theme.cellWrong
      } else if (isActive) {
        ctx.fillStyle = Theme.cellActive
      } else if (inWord) {
        ctx.fillStyle = Theme.cellActiveWord
      } else {
        ctx.fillStyle = Theme.cellBg
      }
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
        ctx.fillStyle = isWrong ? Theme.red : Theme.text
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
  ctx.fillText(`${percentage}${t('percentComplete', lang)} (${filledCells}/${totalCells})`, W / 2, progressBarY + progressBarHeight + 16)

  ctx.fillStyle = Theme.clueBarBg
  ctx.fillRect(0, L.clueY, W, L.clueH)

  ctx.strokeStyle = Theme.clueBarBorder
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, L.clueY)
  ctx.lineTo(W, L.clueY)
  ctx.stroke()

  // Language toggle button (top-right of clue bar)
  const langBtnW = 36
  const langBtnH = 22
  const langBtnX = W - 16 - langBtnW
  const langBtnY = L.clueY + 6
  ctx.fillStyle = Theme.surface
  roundRect(ctx, langBtnX, langBtnY, langBtnW, langBtnH, 6)
  ctx.fill()
  ctx.fillStyle = Theme.blue
  ctx.font = Font.caption
  ctx.textAlign = 'center'
  ctx.fillText(lang === 'en' ? 'EN' : '中', langBtnX + langBtnW / 2, langBtnY + 16)

  UI.langToggleBtn = { x: langBtnX, y: langBtnY, w: langBtnW, h: langBtnH }

  // Hints display (left of lang toggle)
  ctx.fillStyle = Theme.orange
  ctx.font = Font.subhead
  ctx.textAlign = 'right'
  ctx.fillText(`💡 ${State.hints}`, langBtnX - 8, L.clueY + 22)

  const clue = getCurrentClue()
  if (clue) {
    // Direction indicator: "1 ACROSS →" or "1 横 →"
    const dirLabel = State.direction === 'across'
      ? t('directionAcross', lang)
      : t('directionDown', lang)
    const dirArrow = State.direction === 'across' ? '→' : '↓'

    ctx.fillStyle = Theme.blue
    ctx.font = Font.caption
    ctx.textAlign = 'left'
    ctx.fillText(`${clue.num} ${dirLabel} ${dirArrow}`, 16, L.clueY + 18)

    const clueText = clue.clue ? (lang === 'en' ? clue.clue.en : clue.clue.zh) : (lang === 'en' ? clue.text : clue.textZh)

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
    // If an active word exists but clue lookup failed, avoid showing the helper text
    const fallback = (State.grid && !State.grid[State.activeRow]?.[State.activeCol]?.isBlack)
    if (!fallback) {
      ctx.fillStyle = Theme.textTertiary
      ctx.font = Font.body
      ctx.textAlign = 'left'
      ctx.fillText(t('tapCellToSeeClue', lang), 16, L.clueY + 45)
    }
  }

  drawKeyboard(ctx, { Theme, Font, W, Keyboard, L })
}

function drawKeyboard(ctx, deps) {
  const { Theme, Font, W, Keyboard, L } = deps

  ctx.fillStyle = Theme.keyboardBg
  ctx.fillRect(0, L.keyboardY, W, L.keyboardH + L.homeIndicatorH)

  for (const k of Keyboard.layout) {
    const isPressed = Keyboard.pressedKey === k.key

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

function renderTutorial(ctx, deps) {
  const { State, Theme, Font, W, H, UI } = deps
  const lang = State.lang
  const step = State.tutorialStep

  // Dim overlay
  ctx.fillStyle = Theme.tutorialOverlay
  ctx.fillRect(0, 0, W, H)

  // Tutorial card
  const cardW = W - 48
  const cardH = 160
  const cardX = 24
  const cardY = H * 0.35

  ctx.fillStyle = Theme.tutorialBg
  roundRect(ctx, cardX, cardY, cardW, cardH, 16)
  ctx.fill()

  // Step indicator dots
  const dotY = cardY + 24
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === step ? Theme.tutorialAccent : '#D0D0D0'
    ctx.beginPath()
    ctx.arc(W / 2 - 16 + i * 16, dotY, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // Step text
  const stepKeys = ['tutorialStep1', 'tutorialStep2', 'tutorialStep3']
  const stepText = t(stepKeys[step] || stepKeys[0], lang)

  ctx.fillStyle = Theme.text
  ctx.font = Font.headline
  ctx.textAlign = 'center'
  ctx.fillText(stepText, W / 2, cardY + 65)

  // Step illustration (simple visual cue)
  const illustrations = [
    lang === 'en' ? '👆' : '👆',
    lang === 'en' ? '↔ ↕' : '横 ↔ 竖',
    '⌨️ ABC'
  ]
  ctx.font = '28px sans-serif'
  ctx.fillText(illustrations[step], W / 2, cardY + 105)

  // Buttons
  const btnW = 80
  const btnH = 36
  const btnY = cardY + cardH - 48

  // Skip button (left)
  const skipX = cardX + 16
  UI.tutorialSkipBtn = { x: skipX, y: btnY, w: btnW, h: btnH }
  ctx.fillStyle = Theme.textTertiary
  ctx.font = Font.subhead
  ctx.textAlign = 'center'
  ctx.fillText(t('tutorialSkip', lang), skipX + btnW / 2, btnY + 24)

  // Next / Got it button (right)
  const nextX = cardX + cardW - btnW - 16
  ctx.fillStyle = Theme.tutorialAccent
  roundRect(ctx, nextX, btnY, btnW, btnH, 8)
  ctx.fill()
  ctx.fillStyle = Theme.textOnDark
  ctx.font = Font.subhead
  const nextLabel = step >= 2 ? t('tutorialGotIt', lang) : t('tutorialNext', lang)
  ctx.fillText(nextLabel, nextX + btnW / 2, btnY + 24)
  UI.tutorialNextBtn = { x: nextX, y: btnY, w: btnW, h: btnH }
}

function renderComplete(ctx, deps) {
  const { State, Theme, Font, W, H, UI } = deps
  const lang = State.lang

  ctx.fillStyle = Theme.bg
  ctx.fillRect(0, 0, W, H)

  ctx.font = '56px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🎉', W / 2, H * 0.2)

  ctx.fillStyle = Theme.text
  ctx.font = Font.title
  ctx.fillText(t('complete', lang), W / 2, H * 0.2 + 50)

  const cardY = H * 0.35
  const key = State.puzzleId || `puzzle_${(State.puzzleIndex + 1).toString().padStart(3, '0')}`
  const result = State.completed[key] || { time: 0, score: 100 }

  ctx.fillStyle = Theme.surface
  roundRect(ctx, 16, cardY, W - 32, 100, 12)
  ctx.fill()

  const m = Math.floor(result.time / 60)
  const s = result.time % 60

  ctx.fillStyle = Theme.textTertiary
  ctx.font = Font.caption
  ctx.textAlign = 'left'
  ctx.fillText(t('time', lang), 32, cardY + 30)
  ctx.fillText(t('score', lang), 32, cardY + 70)

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
  ctx.fillText(t('nextPuzzle', lang), W / 2, btnY + 32)

  UI.completeNextBtn = { x: 16, y: btnY, w: W - 32, h: 52 }

  const menuY = btnY + 68
  ctx.fillStyle = Theme.surface
  roundRect(ctx, 16, menuY, W - 32, 48, 12)
  ctx.fill()

  ctx.fillStyle = Theme.textSecondary
  ctx.fillText(t('backToMenu', lang), W / 2, menuY + 30)

  UI.completeMenuBtn = { x: 16, y: menuY, w: W - 32, h: 48 }
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

module.exports = { render, renderMenu, renderExams, renderLevels, renderPuzzles, renderPlay, renderComplete, drawKeyboard, renderTutorial }
