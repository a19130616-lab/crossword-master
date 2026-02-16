// Game state and persistence for Crossword Master

// Bump this version to invalidate cached state on new deploys
const STORAGE_VERSION = 7
const STORAGE_KEY = `crossword_v${STORAGE_VERSION}`

const State = {
  screen: 'menu',
  exam: null,
  difficulty: 'easy',
  puzzleIndex: 0,
  puzzleId: null,
  puzzle: null,
  puzzlesIndex: [],
  exams: [],
  grid: null,
  activeRow: 0,
  activeCol: 0,
  direction: 'across',
  score: 0,
  hints: 9999,
  completed: {},
  lang: 'en',
  startTime: 0,
  layout: null,
  puzzleScrollY: 0
}

function loadProgress() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      State.score = parsed.score || 0
      State.hints = parsed.hints ?? 5
      State.completed = parsed.completed || {}
      State.lang = parsed.lang || 'en'
      State.difficulty = parsed.difficulty || 'easy'
      State.exam = parsed.exam || null
    }
  } catch (e) {}
}

function saveProgress() {
  wx.setStorageSync(STORAGE_KEY, JSON.stringify({
    score: State.score,
    hints: State.hints,
    completed: State.completed,
    lang: State.lang,
    difficulty: State.difficulty,
    exam: State.exam
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

function loadExams() {
  try {
    const fs = wx.getFileSystemManager()
    const raw = fs.readFileSync('puzzles/exams.json', 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) State.exams = parsed
  } catch (e) {
    State.exams = []
  }
}

module.exports = { State, loadProgress, saveProgress, loadPuzzlesIndex, loadExams }
