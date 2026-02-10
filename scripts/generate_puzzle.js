#!/usr/bin/env node
/**
 * CrossWord Puzzle Generator v5.0
 * 
 * Generates valid crossword puzzles using backtracking algorithm.
 * Uses AI (LiteLLM proxy) for clue generation with local dictionary fallback.
 * Loads words from wordlist.txt (7000+ common English words).
 * 
 * Usage:
 *   node scripts/generate_puzzle.js --theme "Animals" --difficulty easy
 *   node scripts/generate_puzzle.js --theme "Food" --words "pie,jam,egg,ham" --difficulty easy
 *   node scripts/generate_puzzle.js --difficulty advanced --count 5
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  minGridSize: 3,
  maxGridSize: 10,
  maxAttempts: 50,
  minWords: 3,
  maxWords: 20,
  
  // AI API settings
  apiBase: 'http://localhost:4000',
  apiKey: 'sk-litellm-master-key',
  model: 'claude-sonnet-4',
  
  // Word length ranges by difficulty
  difficulty: {
    easy: { minLen: 3, maxLen: 4, gridMin: 3, gridMax: 5, wordCount: 4 },
    intermediate: { minLen: 4, maxLen: 6, gridMin: 5, gridMax: 7, wordCount: 5 },
    advanced: { minLen: 5, maxLen: 8, gridMin: 6, gridMax: 8, wordCount: 6 }
  }
};

// ═══════════════════════════════════════════════════════════════
// WORDLIST LOADER
// ═══════════════════════════════════════════════════════════════

let WORDLIST = null;

function loadWordlist() {
  if (WORDLIST) return WORDLIST;
  
  const wordlistPath = path.join(__dirname, 'wordlist.txt');
  
  try {
    const content = fs.readFileSync(wordlistPath, 'utf8');
    const allWords = content.split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length >= 3 && w.length <= 8 && /^[a-z]+$/.test(w));
    
    // Organize by length
    WORDLIST = {
      all: allWords,
      byLength: {}
    };
    
    for (let len = 3; len <= 8; len++) {
      WORDLIST.byLength[len] = allWords.filter(w => w.length === len);
    }
    
    console.error(`Loaded ${allWords.length} words from wordlist.txt`);
    return WORDLIST;
  } catch (e) {
    console.error(`Warning: Could not load wordlist.txt: ${e.message}`);
    return { all: [], byLength: {} };
  }
}

/**
 * Get random words from wordlist based on difficulty
 */
function getRandomWords(difficulty, count = 6) {
  const wordlist = loadWordlist();
  const { minLen, maxLen } = CONFIG.difficulty[difficulty] || CONFIG.difficulty.easy;
  
  // Get words in the length range
  const candidates = [];
  for (let len = minLen; len <= maxLen; len++) {
    if (wordlist.byLength[len]) {
      candidates.push(...wordlist.byLength[len]);
    }
  }
  
  if (candidates.length === 0) {
    console.error(`No words found for difficulty ${difficulty} (${minLen}-${maxLen} letters)`);
    return [];
  }
  
  // Shuffle and pick
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  
  // Try to find words that can intersect (share common letters)
  const selected = [];
  const attempts = count * 10;
  
  for (let i = 0; i < attempts && selected.length < count; i++) {
    const word = shuffled[i % shuffled.length];
    
    // Skip if already selected
    if (selected.includes(word)) continue;
    
    // For first word, just add it
    if (selected.length === 0) {
      selected.push(word);
      continue;
    }
    
    // Check if this word shares at least one letter with existing words
    const wordLetters = new Set(word.split(''));
    let hasCommonLetter = false;
    
    for (const existing of selected) {
      for (const letter of existing) {
        if (wordLetters.has(letter)) {
          hasCommonLetter = true;
          break;
        }
      }
      if (hasCommonLetter) break;
    }
    
    if (hasCommonLetter) {
      selected.push(word);
    }
  }
  
  return selected;
}

// ═══════════════════════════════════════════════════════════════
// LOCAL CLUE DICTIONARY (FALLBACK)
// ═══════════════════════════════════════════════════════════════

const CLUE_DICTIONARY = {
  // Common 3-letter words
  cat: { en: 'Furry pet that purrs', zh: '会呼噜叫的毛茸茸宠物' },
  dog: { en: 'Pet that barks', zh: '会汪汪叫的宠物' },
  bat: { en: 'Flying mammal', zh: '会飞的哺乳动物' },
  rat: { en: 'Rodent with long tail', zh: '长尾巴的啮齿动物' },
  ant: { en: 'Tiny insect worker', zh: '小昆虫工作者' },
  cow: { en: 'Farm animal that moos', zh: '哞哞叫的农场动物' },
  owl: { en: 'Night bird', zh: '夜间活动的鸟' },
  pig: { en: 'Pink farm animal', zh: '粉色农场动物' },
  bee: { en: 'Makes honey', zh: '制造蜂蜜' },
  fly: { en: 'Buzzing insect', zh: '嗡嗡叫的昆虫' },
  sun: { en: 'Star in our sky', zh: '我们天空中的星' },
  sky: { en: 'Above the earth', zh: '地球上方' },
  sea: { en: 'Salty water body', zh: '咸水水域' },
  run: { en: 'Move fast on foot', zh: '用脚快速移动' },
  eat: { en: 'Consume food', zh: '吃食物' },
  bed: { en: 'Where you sleep', zh: '睡觉的地方' },
  car: { en: 'Road vehicle', zh: '公路车辆' },
  key: { en: 'Opens a lock', zh: '开锁用的' },
  box: { en: 'Container with lid', zh: '有盖的容器' },
  hat: { en: 'Head covering', zh: '头上戴的' },
  map: { en: 'Shows directions', zh: '显示方向' },
  cup: { en: 'Drinking vessel', zh: '杯子' },
  pen: { en: 'Writing tool', zh: '写字工具' },
  egg: { en: 'Breakfast food', zh: '早餐食物' },
  tea: { en: 'Hot leaf drink', zh: '热茶' },
  ice: { en: 'Frozen water', zh: '冰' },
  hot: { en: 'High temperature', zh: '热的' },
  red: { en: 'Color of blood', zh: '血的颜色' },
  big: { en: 'Large size', zh: '大的' },
  new: { en: 'Not old', zh: '新的' },
  old: { en: 'Not new', zh: '旧的' },
  day: { en: '24 hours', zh: '一天' },
  job: { en: 'Work you do', zh: '你做的工作' },
  fun: { en: 'Enjoyable', zh: '有趣的' },
  top: { en: 'Highest point', zh: '最高点' },
  end: { en: 'Final part', zh: '最后部分' },
  arm: { en: 'Body limb', zh: '身体肢体' },
  leg: { en: 'Walking limb', zh: '走路的肢体' },
  ear: { en: 'Hearing organ', zh: '听觉器官' },
  eye: { en: 'Seeing organ', zh: '视觉器官' },
  
  // Common 4-letter words
  book: { en: 'Reading material', zh: '阅读材料' },
  door: { en: 'Room entrance', zh: '房间入口' },
  tree: { en: 'Tall plant with trunk', zh: '有树干的高大植物' },
  bird: { en: 'Feathered flyer', zh: '有羽毛的飞行者' },
  fish: { en: 'Swims in water', zh: '在水中游泳' },
  lion: { en: 'King of jungle', zh: '丛林之王' },
  bear: { en: 'Large furry mammal', zh: '大型毛茸茸的哺乳动物' },
  duck: { en: 'Quacking bird', zh: '嘎嘎叫的鸟' },
  food: { en: 'What you eat', zh: '吃的东西' },
  milk: { en: 'White drink from cows', zh: '牛的白色饮料' },
  rice: { en: 'Asian grain staple', zh: '亚洲主食谷物' },
  cake: { en: 'Birthday dessert', zh: '生日甜点' },
  work: { en: 'Job; labor', zh: '工作' },
  play: { en: 'Have fun', zh: '玩耍' },
  read: { en: 'Look at words', zh: '看文字' },
  walk: { en: 'Move on foot', zh: '步行' },
  rain: { en: 'Water from clouds', zh: '云里来的水' },
  snow: { en: 'White frozen flakes', zh: '白色雪花' },
  wind: { en: 'Moving air', zh: '移动的空气' },
  moon: { en: 'Night sky circle', zh: '夜空中的圆' },
  lake: { en: 'Fresh water body', zh: '淡水湖' },
  hill: { en: 'Small mountain', zh: '小山' },
  rock: { en: 'Hard stone', zh: '硬石头' },
  wave: { en: 'Ocean movement', zh: '海浪' },
  fast: { en: 'Quick', zh: '快的' },
  slow: { en: 'Not fast', zh: '慢的' },
  soft: { en: 'Not hard', zh: '软的' },
  hard: { en: 'Not soft', zh: '硬的' },
  warm: { en: 'Comfortably hot', zh: '温暖的' },
  cold: { en: 'Low temperature', zh: '冷的' },
  blue: { en: 'Sky color', zh: '天空的颜色' },
  game: { en: 'Fun activity', zh: '游戏' },
  home: { en: 'Where you live', zh: '你住的地方' },
  name: { en: 'What you are called', zh: '你叫什么' },
  time: { en: 'Hours and minutes', zh: '小时和分钟' },
  year: { en: '365 days', zh: '365天' },
  life: { en: 'Being alive', zh: '活着' },
  love: { en: 'Deep affection', zh: '深深的爱' },
  help: { en: 'Assist someone', zh: '帮助某人' },
  
  // Common 5-letter words
  water: { en: 'H2O liquid', zh: '水' },
  earth: { en: 'Our planet', zh: '我们的星球' },
  house: { en: 'Home building', zh: '住宅建筑' },
  table: { en: 'Furniture for eating', zh: '吃饭的家具' },
  chair: { en: 'Seat with back', zh: '有靠背的座位' },
  glass: { en: 'Transparent material', zh: '透明材料' },
  paper: { en: 'Writing surface', zh: '书写表面' },
  horse: { en: 'Riding animal', zh: '骑乘动物' },
  mouse: { en: 'Small rodent', zh: '小老鼠' },
  tiger: { en: 'Striped big cat', zh: '条纹大猫' },
  snake: { en: 'Slithering reptile', zh: '蛇' },
  bread: { en: 'Baked from flour', zh: '面粉烤的' },
  fruit: { en: 'Sweet plant food', zh: '甜的植物食物' },
  clock: { en: 'Shows the time', zh: '显示时间' },
  phone: { en: 'Call device', zh: '电话' },
  cloud: { en: 'Sky cotton', zh: '天上的棉花' },
  river: { en: 'Flowing water', zh: '流动的水' },
  ocean: { en: 'Vast sea', zh: '广阔的海' },
  beach: { en: 'Sandy shore', zh: '沙滩' },
  grass: { en: 'Green ground cover', zh: '绿色草地' },
  light: { en: 'Not dark', zh: '光明' },
  night: { en: 'Dark time', zh: '黑暗时间' },
  sleep: { en: 'Rest at night', zh: '夜间休息' },
  dream: { en: 'Sleep vision', zh: '梦' },
  think: { en: 'Use your brain', zh: '用脑子想' },
  learn: { en: 'Gain knowledge', zh: '学习知识' },
  happy: { en: 'Feeling joy', zh: '快乐的' },
  funny: { en: 'Makes you laugh', zh: '好笑的' },
  sweet: { en: 'Like sugar', zh: '甜的' },
  music: { en: 'Sounds with rhythm', zh: '有节奏的声音' },
  movie: { en: 'Film to watch', zh: '看的电影' },
  story: { en: 'Tale to tell', zh: '讲的故事' },
  world: { en: 'All of Earth', zh: '整个地球' },
  money: { en: 'Used to buy things', zh: '用来买东西' },
  child: { en: 'Young person', zh: '小孩' },
  woman: { en: 'Adult female', zh: '成年女性' },
  
  // Common 6-letter words
  animal: { en: 'Living creature', zh: '生物' },
  flower: { en: 'Plant bloom', zh: '植物花朵' },
  garden: { en: 'Plant growing area', zh: '种植区' },
  window: { en: 'Glass wall opening', zh: '玻璃墙开口' },
  rabbit: { en: 'Hopping pet', zh: '跳跃的宠物' },
  monkey: { en: 'Tree-swinging animal', zh: '荡秋千的动物' },
  turtle: { en: 'Shelled reptile', zh: '有壳爬行动物' },
  spider: { en: 'Eight-legged crawler', zh: '八脚爬虫' },
  banana: { en: 'Yellow fruit', zh: '黄色水果' },
  orange: { en: 'Citrus fruit', zh: '柑橘水果' },
  cheese: { en: 'Dairy product', zh: '奶制品' },
  butter: { en: 'Bread spread', zh: '黄油' },
  dinner: { en: 'Evening meal', zh: '晚餐' },
  coffee: { en: 'Morning drink', zh: '早晨饮料' },
  forest: { en: 'Many trees together', zh: '很多树在一起' },
  desert: { en: 'Sandy dry land', zh: '沙漠' },
  winter: { en: 'Cold season', zh: '冷的季节' },
  summer: { en: 'Hot season', zh: '热的季节' },
  spring: { en: 'Flower season', zh: '花开的季节' },
  doctor: { en: 'Heals sick people', zh: '治病的人' },
  friend: { en: 'Person you like', zh: '你喜欢的人' },
  family: { en: 'Related people', zh: '有亲戚关系的人' },
  sister: { en: 'Female sibling', zh: '姐妹' },
  mother: { en: 'Female parent', zh: '妈妈' },
  father: { en: 'Male parent', zh: '爸爸' },
  school: { en: 'Place to learn', zh: '学习的地方' },
  number: { en: '1, 2, 3, etc.', zh: '数字' },
  letter: { en: 'A, B, C, etc.', zh: '字母' },
  yellow: { en: 'Sun color', zh: '太阳的颜色' },
  purple: { en: 'Royal color', zh: '皇室的颜色' },
  
  // Common 7-8 letter words
  kitchen: { en: 'Cooking room', zh: '做饭的房间' },
  bedroom: { en: 'Sleeping room', zh: '睡觉的房间' },
  teacher: { en: 'School instructor', zh: '学校老师' },
  student: { en: 'Person learning', zh: '学习的人' },
  brother: { en: 'Male sibling', zh: '兄弟' },
  weather: { en: 'Rain or shine', zh: '天气' },
  morning: { en: 'Start of day', zh: '一天的开始' },
  evening: { en: 'End of day', zh: '一天的结束' },
  rainbow: { en: 'Colorful sky arc', zh: '彩虹' },
  dolphin: { en: 'Smart sea mammal', zh: '聪明的海洋哺乳动物' },
  penguin: { en: 'Tuxedo bird', zh: '穿燕尾服的鸟' },
  giraffe: { en: 'Long-necked animal', zh: '长脖子动物' },
  chicken: { en: 'Farm bird', zh: '农场鸟' },
  picture: { en: 'Image or photo', zh: '图片或照片' },
  elephant: { en: 'Large trunk animal', zh: '有长鼻子的大动物' },
  computer: { en: 'Digital machine', zh: '数字机器' },
  internet: { en: 'World wide web', zh: '互联网' },
  mountain: { en: 'Very tall hill', zh: '很高的山' },
  building: { en: 'Large structure', zh: '大型建筑' },
  airplane: { en: 'Flying vehicle', zh: '飞机' },
  sunshine: { en: 'Light from sun', zh: '阳光' },
  homework: { en: 'School assignment', zh: '家庭作业' },
  sandwich: { en: 'Bread with filling', zh: '三明治' },
  bathroom: { en: 'Washing room', zh: '浴室' },
  umbrella: { en: 'Rain protection', zh: '雨伞' },
  keyboard: { en: 'Typing tool', zh: '键盘' },
  football: { en: 'Team ball sport', zh: '足球' },
  baseball: { en: 'Bat and ball game', zh: '棒球' },
  tomorrow: { en: 'Day after today', zh: '明天' },
  everyone: { en: 'All people', zh: '每个人' },
  question: { en: 'Asking something', zh: '问题' },
  together: { en: 'With each other', zh: '一起' }
};

// ═══════════════════════════════════════════════════════════════
// AI CLUE GENERATOR (PRIMARY)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate clues using AI API (LiteLLM proxy)
 */
async function generateCluesAI(words, difficulty = 'easy') {
  const difficultyInstruction = difficulty === 'easy' 
    ? "Use simple, direct definitions that a child could understand."
    : difficulty === 'intermediate'
    ? "Use slightly clever clues with simple wordplay."
    : "Use clever wordplay, puns, or cultural references.";
  
  const prompt = `You are a crossword puzzle creator. Create clues for these words: ${words.join(', ')}.

Rules:
1. Each clue should be short (under 40 characters if possible)
2. ${difficultyInstruction}
3. Provide a natural Chinese translation for each clue
4. Return ONLY a JSON array, no other text

Format: [{"word": "cat", "en": "Furry pet that purrs", "zh": "会呼噜叫的毛茸茸宠物"}]`;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };

    const req = require('http').request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            throw new Error(response.error.message || 'API Error');
          }
          
          const content = response.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error('No content in API response');
          }
          
          // Parse JSON from response (handle code blocks)
          let jsonStr = content.trim();
          const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) jsonStr = jsonMatch[1];
          
          const clueArray = JSON.parse(jsonStr);
          if (!Array.isArray(clueArray)) {
            throw new Error('Expected JSON array');
          }
          
          const clues = {};
          for (const item of clueArray) {
            if (item.word && item.en && item.zh) {
              clues[item.word.toLowerCase()] = { en: item.en, zh: item.zh };
            }
          }
          
          resolve(clues);
        } catch (error) {
          reject(new Error(`Failed to parse AI response: ${error.message}`));
        }
      });
    });

    req.on('error', error => reject(new Error(`API request failed: ${error.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('API request timed out'));
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Generate clues - tries AI first, falls back to local dictionary
 */
async function generateClues(words, difficulty = 'easy') {
  // Try AI generation first
  try {
    console.error('Generating clues via AI...');
    const aiClues = await generateCluesAI(words, difficulty);
    console.error(`Generated ${Object.keys(aiClues).length} AI clues`);
    
    // Fill in any missing with local dictionary
    const clues = { ...aiClues };
    for (const word of words) {
      const key = word.toLowerCase();
      if (!clues[key]) {
        if (CLUE_DICTIONARY[key]) {
          clues[key] = CLUE_DICTIONARY[key];
        } else {
          clues[key] = { en: `Word: ${word.toUpperCase()}`, zh: `单词：${word.toUpperCase()}` };
        }
      }
    }
    
    return clues;
  } catch (error) {
    console.error(`AI clue generation failed: ${error.message}`);
    console.error('Falling back to local dictionary...');
    
    // Fallback to local dictionary
    const clues = {};
    for (const word of words) {
      const key = word.toLowerCase();
      if (CLUE_DICTIONARY[key]) {
        clues[key] = CLUE_DICTIONARY[key];
      } else {
        clues[key] = { en: `Word: ${word.toUpperCase()}`, zh: `单词：${word.toUpperCase()}` };
      }
    }
    
    return clues;
  }
}

// ═══════════════════════════════════════════════════════════════
// GRID CLASS
// ═══════════════════════════════════════════════════════════════

class Grid {
  constructor(size) {
    this.size = size;
    this.cells = Array(size).fill(null).map(() => Array(size).fill(null));
    this.placements = [];
  }
  
  clone() {
    const g = new Grid(this.size);
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        g.cells[r][c] = this.cells[r][c];
      }
    }
    g.placements = [...this.placements];
    return g;
  }
  
  canPlace(word, row, col, direction) {
    const len = word.length;
    const wordUpper = word.toUpperCase();
    
    if (direction === 'across') {
      if (col + len > this.size) return false;
    } else {
      if (row + len > this.size) return false;
    }
    
    if (this.placements.length === 0) return true;
    
    let hasIntersection = false;
    
    for (let i = 0; i < len; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;
      const letter = wordUpper[i];
      
      if (this.cells[r][c] !== null) {
        if (this.cells[r][c] !== letter) return false;
        hasIntersection = true;
      }
    }
    
    return hasIntersection;
  }
  
  place(word, row, col, direction) {
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;
      this.cells[r][c] = word[i].toUpperCase();
    }
    this.placements.push({ word: word.toUpperCase(), row, col, direction });
  }
  
  getValidPlacements(word) {
    const positions = [];
    
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.canPlace(word, r, c, 'across')) {
          positions.push({ row: r, col: c, direction: 'across' });
        }
        if (this.canPlace(word, r, c, 'down')) {
          positions.push({ row: r, col: c, direction: 'down' });
        }
      }
    }
    
    return positions.sort(() => Math.random() - 0.5);
  }
  
  trim() {
    let minRow = this.size, maxRow = -1;
    let minCol = this.size, maxCol = -1;
    
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.cells[r][c] !== null) {
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r);
          minCol = Math.min(minCol, c);
          maxCol = Math.max(maxCol, c);
        }
      }
    }
    
    if (maxRow === -1) return null;
    
    const rows = maxRow - minRow + 1;
    const cols = maxCol - minCol + 1;
    const trimmed = [];
    
    for (let r = minRow; r <= maxRow; r++) {
      const row = [];
      for (let c = minCol; c <= maxCol; c++) {
        row.push(this.cells[r][c]);
      }
      trimmed.push(row);
    }
    
    const remappedPlacements = this.placements.map(p => ({
      ...p,
      row: p.row - minRow,
      col: p.col - minCol
    }));
    
    return { solution: trimmed, placements: remappedPlacements, rows, cols };
  }
}

// ═══════════════════════════════════════════════════════════════
// PUZZLE GENERATOR
// ═══════════════════════════════════════════════════════════════

function generatePuzzle(words, targetSize = null) {
  const sortedWords = [...words].sort((a, b) => b.length - a.length);
  const maxWordLen = Math.max(...sortedWords.map(w => w.length));
  const minSize = Math.max(CONFIG.minGridSize, maxWordLen);
  const maxSize = Math.min(CONFIG.maxGridSize, targetSize || maxWordLen + 3);
  
  for (let size = minSize; size <= maxSize; size++) {
    const result = backtrack(new Grid(size), sortedWords, 0);
    if (result) return result;
  }
  
  return null;
}

function backtrack(grid, words, index) {
  if (index >= words.length) {
    return grid;
  }
  
  const word = words[index];
  const positions = grid.getValidPlacements(word);
  
  for (const pos of positions) {
    const newGrid = grid.clone();
    newGrid.place(word, pos.row, pos.col, pos.direction);
    const result = backtrack(newGrid, words, index + 1);
    if (result) return result;
  }
  
  if (grid.placements.length >= CONFIG.minWords) {
    return backtrack(grid, words, index + 1);
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

function validate(solution, placements) {
  const rows = solution.length;
  const cols = solution[0].length;
  const errors = [];
  
  // Check for orphan letters
  const coveredCells = new Set();
  for (const p of placements) {
    for (let i = 0; i < p.word.length; i++) {
      const r = p.direction === 'across' ? p.row : p.row + i;
      const c = p.direction === 'across' ? p.col + i : p.col;
      coveredCells.add(`${r},${c}`);
    }
  }
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (solution[r][c] !== null && !coveredCells.has(`${r},${c}`)) {
        errors.push(`Orphan letter at (${r},${c})`);
      }
    }
  }
  
  // Check connectivity
  const visited = new Set();
  const queue = [];
  
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (solution[r][c] !== null) {
        queue.push([r, c]);
        visited.add(`${r},${c}`);
        break outer;
      }
    }
  }
  
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const key = `${nr},${nc}`;
        if (solution[nr][nc] !== null && !visited.has(key)) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
  }
  
  let totalCells = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (solution[r][c] !== null) totalCells++;
    }
  }
  
  if (visited.size !== totalCells) {
    errors.push(`Grid has disconnected cells`);
  }
  
  if (placements.length < CONFIG.minWords) {
    errors.push(`Only ${placements.length} words, minimum is ${CONFIG.minWords}`);
  }
  
  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════
// OUTPUT FORMATTER
// ═══════════════════════════════════════════════════════════════

function formatOutput(theme, trimmedGrid, clues, difficulty = 'easy') {
  const { solution, placements, rows, cols } = trimmedGrid;
  
  const numberMap = new Map();
  let num = 1;
  
  const sortedPlacements = [...placements].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
  
  for (const p of sortedPlacements) {
    const key = `${p.row},${p.col}`;
    if (!numberMap.has(key)) {
      numberMap.set(key, num++);
    }
  }
  
  const acrossClues = [];
  const downClues = [];
  
  for (const p of sortedPlacements) {
    const key = `${p.row},${p.col}`;
    const clueNum = numberMap.get(key);
    const wordClue = clues[p.word.toLowerCase()] || { en: p.word, zh: p.word };
    
    const clueObj = {
      num: clueNum,
      row: p.row,
      col: p.col,
      text: wordClue.en,
      textZh: wordClue.zh
    };
    
    if (p.direction === 'across') {
      acrossClues.push(clueObj);
    } else {
      downClues.push(clueObj);
    }
  }
  
  // Prefilled cells based on difficulty
  const prefilled = [];
  const totalCells = rows * cols - solution.flat().filter(cell => cell === null).length;
  
  if (difficulty === 'easy') {
    const targetCount = Math.floor(totalCells * 0.3);
    const allCells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (solution[r][c] !== null) allCells.push([r, c]);
      }
    }
    allCells.sort(() => Math.random() - 0.5);
    prefilled.push(...allCells.slice(0, targetCount));
  } else if (difficulty === 'intermediate') {
    for (const p of sortedPlacements) {
      prefilled.push([p.row, p.col]);
    }
  }
  // Advanced: no prefilled cells
  
  return {
    id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: theme,
    solution,
    prefilled,
    clues: { across: acrossClues, down: downClues }
  };
}

// ═══════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    theme: 'Generated Puzzle',
    words: [],
    size: null,
    difficulty: 'easy',
    count: 1
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--theme':
      case '-t':
        options.theme = args[++i];
        break;
      case '--words':
      case '-w':
        options.words = args[++i].split(',').map(w => w.trim().toLowerCase());
        break;
      case '--size':
      case '-s':
        options.size = parseInt(args[++i]);
        break;
      case '--difficulty':
      case '-d':
        const diff = args[++i].toLowerCase();
        if (['easy', 'intermediate', 'advanced'].includes(diff)) {
          options.difficulty = diff;
        } else {
          console.error('Invalid difficulty. Use: easy, intermediate, or advanced');
          process.exit(1);
        }
        break;
      case '--count':
      case '-c':
        options.count = parseInt(args[++i]);
        break;
      case '--help':
      case '-h':
        console.log(`
CrossWord Puzzle Generator v5.0

Usage:
  node generate_puzzle.js --difficulty easy --count 10
  node generate_puzzle.js --theme "Animals" --words "cat,dog,bat,rat"
  node generate_puzzle.js -d advanced -c 5

Options:
  --theme, -t        Puzzle theme/title
  --words, -w        Comma-separated word list (optional - uses wordlist.txt if not provided)
  --size, -s         Target grid size
  --difficulty, -d   Difficulty level: easy (3-4 letters), intermediate (4-6), advanced (5-8)
  --count, -c        Generate N puzzles
  --help, -h         Show this help

The generator uses AI (LiteLLM proxy at localhost:4000) for clue generation.
Falls back to local dictionary if AI is unavailable.
`);
        process.exit(0);
    }
  }
  
  return options;
}

async function main() {
  const options = parseArgs();
  const results = [];
  
  // Load wordlist
  loadWordlist();
  
  for (let i = 0; i < options.count; i++) {
    console.error(`\n━━━ Generating puzzle ${i + 1}/${options.count} ━━━`);
    
    // Get words - use provided or pick random from wordlist
    let words = options.words.length > 0 
      ? options.words 
      : getRandomWords(options.difficulty, CONFIG.difficulty[options.difficulty].wordCount + 2);
    
    if (words.length < CONFIG.minWords) {
      console.error(`Not enough words. Trying again...`);
      continue;
    }
    
    console.error(`Words: ${words.join(', ')}`);
    console.error(`Difficulty: ${options.difficulty}`);
    
    // Generate clues
    const clues = await generateClues(words, options.difficulty);
    
    // Generate grid (with retries)
    let grid = null;
    for (let attempt = 0; attempt < CONFIG.maxAttempts && !grid; attempt++) {
      grid = generatePuzzle(words, options.size);
      if (!grid && options.words.length === 0) {
        // Try different words
        words = getRandomWords(options.difficulty, CONFIG.difficulty[options.difficulty].wordCount + 2);
      }
    }
    
    if (!grid) {
      console.error('Failed to generate puzzle grid');
      continue;
    }
    
    const trimmed = grid.trim();
    if (!trimmed) {
      console.error('Empty grid generated');
      continue;
    }
    
    console.error(`Grid: ${trimmed.rows}x${trimmed.cols} with ${grid.placements.length} words`);
    
    const validation = validate(trimmed.solution, trimmed.placements);
    if (!validation.valid) {
      console.error('Validation failed:', validation.errors);
      continue;
    }
    
    console.error('Validation: PASSED');
    
    // Print grid
    console.error('Grid:');
    for (const row of trimmed.solution) {
      console.error('  ' + row.map(c => c || '.').join(' '));
    }
    
    const output = formatOutput(options.theme, trimmed, clues, options.difficulty);
    results.push(output);
  }
  
  if (results.length === 0) {
    console.error('\nFailed to generate any puzzles');
    process.exit(1);
  }
  
  // Output JSON
  if (options.count === 1) {
    console.log(JSON.stringify(results[0], null, 2));
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
  
  console.error(`\n✓ Generated ${results.length}/${options.count} puzzles`);
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
