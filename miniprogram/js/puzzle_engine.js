// Core gameplay logic for Crossword Master

function createEngine(deps) {
  const { State, Theme, calculateLayout, W, H, SAFE_TOP, HOME_INDICATOR, saveProgress, Haptics } = deps

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

  function trimGrid(puzzleData) {
    const bounds = calculateBoundingBox(puzzleData.solution)
    if (!bounds) return null

    const { minRow, maxRow, minCol, maxCol } = bounds
    const rows = maxRow - minRow + 1
    const cols = maxCol - minCol + 1

    const trimmedSolution = []
    for (let r = minRow; r <= maxRow; r++) {
      const row = []
      for (let c = minCol; c <= maxCol; c++) {
        row.push(puzzleData.solution[r][c])
      }
      trimmedSolution.push(row)
    }

    const prefilledList = Array.isArray(puzzleData.prefilled) ? puzzleData.prefilled : []
    const trimmedPrefilled = prefilledList
      .filter(([r, c]) => r >= minRow && r <= maxRow && c >= minCol && c <= maxCol)
      .map(([r, c]) => [r - minRow, c - minCol])

    const trimmedClues = {
      across: puzzleData.clues.across
        .filter(cl => cl.row >= minRow && cl.row <= maxRow && cl.col >= minCol && cl.col <= maxCol)
        .map(cl => ({ ...cl, row: cl.row - minRow, col: cl.col - minCol })),
      down: puzzleData.clues.down
        .filter(cl => cl.row >= minRow && cl.row <= maxRow && cl.col >= minCol && cl.col <= maxCol)
        .map(cl => ({ ...cl, row: cl.row - minRow, col: cl.col - minCol }))
    }

    return { ...puzzleData, rows, cols, solution: trimmedSolution, prefilled: trimmedPrefilled, clues: trimmedClues, bounds }
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

  function initPuzzle(puzzleData, index) {
    if (!puzzleData) return false

    const prefilledByDifficulty = (!Array.isArray(puzzleData.prefilled) && puzzleData.prefilled) ? puzzleData.prefilled : null
    const prefilledList = prefilledByDifficulty ? (prefilledByDifficulty[State.difficulty] || []) : (puzzleData.prefilled || [])

    const puzzleDataWithPrefilled = { ...puzzleData, prefilled: prefilledList }
    const trimmed = trimGrid(puzzleDataWithPrefilled)
    if (!trimmed) return false

    State.puzzleIndex = index
    State.puzzleId = puzzleData.id || null
    State.puzzle = trimmed

    const { rows, cols } = trimmed
    State.grid = []

    for (let r = 0; r < rows; r++) {
      State.grid[r] = []
      for (let c = 0; c < cols; c++) {
        const answer = trimmed.solution[r]?.[c]
        if (answer === null || answer === undefined) {
          State.grid[r][c] = { r, c, val: null, answer: null, isBlack: true, status: 'black', clueRefs: [] }
        } else {
          const isPrefilled = trimmed.prefilled.some(p => p[0] === r && p[1] === c)
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

    for (const clue of trimmed.clues.across) {
      const cells = getWordCellsStatic(State.grid, rows, cols, clue.row, clue.col, 'across')
      for (const [r, c] of cells) {
        if (State.grid[r]?.[c]) State.grid[r][c].clueRefs.push(`${clue.num}A`)
      }
    }
    for (const clue of trimmed.clues.down) {
      const cells = getWordCellsStatic(State.grid, rows, cols, clue.row, clue.col, 'down')
      for (const [r, c] of cells) {
        if (State.grid[r]?.[c]) State.grid[r][c].clueRefs.push(`${clue.num}D`)
      }
    }

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

      if (hasDown && !hasAcross) {
        State.direction = 'down'
      } else if (hasAcross && !hasDown) {
        State.direction = 'across'
      }
    }
  }

  function moveToNextCell() {
    const cells = getWordCells(State.activeRow, State.activeCol, State.direction)
    const idx = cells.findIndex(([r, c]) => r === State.activeRow && c === State.activeCol)

    for (let i = idx + 1; i < cells.length; i++) {
      const [r, c] = cells[i]
      const nextCell = State.grid[r][c]
      if (nextCell.status === 'empty') {
        State.activeRow = r
        State.activeCol = c
        return true
      }
    }

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

  function inputLetter(letter) {
    const cell = State.grid[State.activeRow]?.[State.activeCol]

    if (!cell || cell.isBlack || cell.status === 'locked') {
      moveToNextCell()
      return
    }

    try { wx.vibrateShort({ type: 'light' }) } catch (e) {}
    Haptics.tap()

    cell.val = letter.toUpperCase()
    cell.status = 'filled'
    moveToNextCell()
    checkWinCondition()
  }

  function handleBackspace() {
    const cell = State.grid[State.activeRow]?.[State.activeCol]

    try { wx.vibrateShort({ type: 'light' }) } catch (e) {}

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

    for (let r = 0; r < State.grid.length; r++) {
      for (let c = 0; c < State.grid[r].length; c++) {
        const cell = State.grid[r][c]
        if (!cell.isBlack && cell.status !== 'locked') {
          if (cell.val !== cell.answer) return false
        }
      }
    }

    const elapsed = Math.floor((Date.now() - State.startTime) / 1000)
    const bonus = Math.max(0, 300 - elapsed)
    const points = 100 + bonus

    State.score += points
    const completedKey = State.puzzleId || `puzzle_${(State.puzzleIndex + 1).toString().padStart(3, '0')}`
    State.completed[completedKey] = { time: elapsed, score: points }
    saveProgress()

    try { wx.vibrateLong() } catch (e) {}
    Haptics.success()

    wx.showToast({ title: '🎉 Puzzle Solved!', icon: 'none', duration: 2000 })
    setTimeout(() => { State.screen = 'complete' }, 500)

    return true
  }

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

          Haptics.tap()

          if (k.key === '⌫') handleBackspace()
          else if (k.key === '💡') useHint()
          else inputLetter(k.key)
          setTimeout(() => { this.pressedKey = null }, 100)
          return true
        }
      }
      return false
    }
  }

  return {
    initPuzzle,
    getWordCells,
    getWordCellsStatic,
    getCellNumber,
    getCurrentClue,
    cellHasDirection,
    handleCellTap,
    inputLetter,
    handleBackspace,
    useHint,
    checkWinCondition,
    moveToNextCell,
    moveToPrevCell,
    Keyboard
  }
}

module.exports = { createEngine }
