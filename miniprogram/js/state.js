// Game state and persistence for Crossword Master

const State = {
  screen: 'menu',
  difficulty: 'easy',
  puzzleIndex: 0,
  puzzleId: null,
  puzzle: null,
  puzzlesIndex: [],
  grid: null,
  activeRow: 0,
  activeCol: 0,
  direction: 'across',
  score: 0,
  hints: 5,
  completed: {},
  lang: 'en',
  startTime: 0,
  layout: null,
  puzzleScrollY: 0
}

function loadProgress() {
  try {
    const data = wx.getStorageSync('crossword_v5')
    if (data) {
      const parsed = JSON.parse(data)
      State.score = parsed.score || 0
      State.hints = parsed.hints ?? 5
      State.completed = parsed.completed || {}
      State.lang = parsed.lang || 'en'
      State.difficulty = parsed.difficulty || 'easy'
    }
  } catch (e) {}
}

function saveProgress() {
  wx.setStorageSync('crossword_v5', JSON.stringify({
    score: State.score,
    hints: State.hints,
    completed: State.completed,
    lang: State.lang,
    difficulty: State.difficulty
  }))
}

function loadPuzzlesIndex() {
  try {
    const fs = wx.getFileSystemManager()
    const raw = fs.readFileSync('puzzles/index.json', 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) State.puzzlesIndex = parsed
  } catch (e) {
    State.puzzlesIndex = []
  }
}

module.exports = { State, loadProgress, saveProgress, loadPuzzlesIndex }
