// Game state and persistence for Crossword Master

const State = {
  screen: 'menu',
  level: 'elementary',
  puzzleIndex: 0,
  puzzle: null,
  grid: null,
  activeRow: 0,
  activeCol: 0,
  direction: 'across',
  score: 0,
  hints: 5,
  completed: {},
  lang: 'en',
  startTime: 0,
  layout: null
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
    }
  } catch (e) {}
}

function saveProgress() {
  wx.setStorageSync('crossword_v5', JSON.stringify({
    score: State.score,
    hints: State.hints,
    completed: State.completed,
    lang: State.lang
  }))
}

module.exports = { State, loadProgress, saveProgress }
