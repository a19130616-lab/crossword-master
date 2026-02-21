// Internationalization strings for Crossword Master
// Add new languages by adding a key to each entry.

const strings = {
  // Menu screen
  play: { en: 'Play', zh: '开始游戏' },
  score: { en: 'SCORE', zh: '分数' },
  hints: { en: 'HINTS', zh: '提示' },
  langHintEN: { en: 'EN  English hints', zh: 'EN  English hints' },
  langHintZH: { en: 'ZH  中文提示', zh: 'ZH  中文提示' },

  // Navigation
  back: { en: '‹ Back', zh: '‹ 返回' },

  // Exam selection
  selectVocabLevel: { en: 'Select Vocab Level', zh: '选择词汇等级' },
  completed: { en: 'completed', zh: '已完成' },

  // Difficulty selection
  selectDifficulty: { en: 'Select Difficulty', zh: '选择难度' },
  difficultyEasy: { en: 'Easy', zh: '简单' },
  difficultyMedium: { en: 'Medium', zh: '中等' },
  difficultyHard: { en: 'Hard', zh: '困难' },

  // Puzzle selection
  selectPuzzle: { en: 'Select Puzzle', zh: '选择谜题' },

  // Play screen
  directionAcross: { en: 'ACROSS', zh: '横' },
  directionDown: { en: 'DOWN', zh: '竖' },
  tapCellToSeeClue: { en: 'Tap a cell to see clue', zh: '点击格子查看提示' },
  percentComplete: { en: '% Complete', zh: '% 完成' },

  // Wrong letter feedback
  wrongLetter: { en: 'Not quite — try again!', zh: '不太对——再试试！' },

  // Complete screen
  complete: { en: 'Complete!', zh: '完成！' },
  nextPuzzle: { en: 'Next Puzzle', zh: '下一题' },
  backToMenu: { en: 'Back to Menu', zh: '返回菜单' },
  time: { en: 'TIME', zh: '用时' },

  // Tutorial
  tutorialStep1: { en: 'Tap a cell to select it', zh: '点击格子选中它' },
  tutorialStep2: { en: 'Tap the same cell to switch direction', zh: '再次点击切换方向' },
  tutorialStep3: { en: 'Type letters on the keyboard to fill in', zh: '用键盘输入字母填写' },
  tutorialGotIt: { en: 'Got it!', zh: '知道了！' },
  tutorialNext: { en: 'Next', zh: '下一步' },
  tutorialSkip: { en: 'Skip', zh: '跳过' },
}

/**
 * Get a localized string.
 * @param {string} key - The string key
 * @param {string} lang - Language code ('en', 'zh', etc.)
 * @returns {string}
 */
function t(key, lang) {
  const entry = strings[key]
  if (!entry) return key
  return entry[lang] || entry.en || key
}

module.exports = { t, strings }
