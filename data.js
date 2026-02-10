/**
 * CrossWord Master - Puzzle Data
 * 
 * 30 high-quality puzzles across all difficulty levels.
 * ALL WORDS VERIFIED as real English words.
 * Every continuous letter sequence (2+ letters) is a valid word.
 */

const LEVELS = {
  elementary: { name: 'Elementary', icon: '🌱' },
  intermediate: { name: 'Intermediate', icon: '📚' },
  advanced: { name: 'Advanced', icon: '🎯' }
}

const PUZZLES = {
  elementary: [
    // ═══════════════════════════════════════════════════════════════
    // EASY PUZZLES (10) - 3-4 letter words, 3×3 grids
    // ═══════════════════════════════════════════════════════════════
    
    // Puzzle 1: CUP, TEN, CAT, PEN
    // C U P
    // A . E
    // T E N
    {
      id: 1,
      title: 'Pet Friends',
      solution: [
        ['C', 'U', 'P'],
        ['A', null, 'E'],
        ['T', 'E', 'N']
      ],
      prefilled: [[0, 0], [2, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Drinking vessel', textZh: '杯子' },
          { num: 3, row: 2, col: 0, text: 'Number after nine', textZh: '九之后的数字' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Furry pet that purrs', textZh: '会呼噜叫的毛茸茸宠物' },
          { num: 2, row: 0, col: 2, text: 'Writing tool with ink', textZh: '有墨水的写字工具' }
        ]
      }
    },
    
    // Puzzle 2: BAD, BET, TAD, ADD (no DDD column!)
    // B E T
    // A . O
    // D O G
    // Words: BET, DOG (across), BAD, TOG (down) - wait TOG not common
    // Better: BED, END, BET, DENT - too complex
    // Try: BAT, BEE, BAD, TED
    // B A T
    // E . E
    // D E D - no DED isn't word
    // Simpler:
    // B E D
    // O . O
    // W E T
    // Words: BED, WET (across), BOW, DOT (down)
    {
      id: 2,
      title: 'Around the House',
      solution: [
        ['B', 'E', 'D'],
        ['O', null, 'O'],
        ['W', 'E', 'T']
      ],
      prefilled: [[0, 0], [2, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Where you sleep', textZh: '床' },
          { num: 3, row: 2, col: 0, text: 'Not dry', textZh: '湿的' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Ribbon knot', textZh: '蝴蝶结' },
          { num: 2, row: 0, col: 2, text: 'Small round mark', textZh: '点' }
        ]
      }
    },
    
    // Puzzle 3: BUS, TUB, BUT, SUB
    // B U S
    // U . U
    // T U B
    // Words: BUS, TUB (across), BUT, SUB (down) - all valid!
    {
      id: 3,
      title: 'Travel Time',
      solution: [
        ['B', 'U', 'S'],
        ['U', null, 'U'],
        ['T', 'U', 'B']
      ],
      prefilled: [[0, 0], [2, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Public transport', textZh: '公共汽车' },
          { num: 3, row: 2, col: 0, text: 'Bath container', textZh: '浴缸' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'However', textZh: '但是' },
          { num: 2, row: 0, col: 2, text: 'Replacement', textZh: '替代' }
        ]
      }
    },
    
    // Puzzle 4: HAM, HAT, MAT, ATE
    // H A M
    // A T E
    // T . .
    // Words: HAM, ATE (across), HAT, AM, ME, AT... wait, need only 2+ letters
    // Let me redo: HAM (across), ATE (across), HAT (down), ME (down)
    // Actually ME is only 2 letters - acceptable
    {
      id: 4,
      title: 'Food Time',
      solution: [
        ['H', 'A', 'M'],
        ['A', 'T', 'E'],
        ['T', null, null]
      ],
      prefilled: [[0, 0], [1, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Cured pork meat', textZh: '火腿' },
          { num: 2, row: 1, col: 0, text: 'Past of eat', textZh: '吃的过去式' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Head covering', textZh: '帽子' },
          { num: 3, row: 0, col: 1, text: 'On; near', textZh: '在...上' }
        ]
      }
    },
    
    // Puzzle 5: RUN, MAP, RAM, NAP
    // R A M
    // U . A
    // N A P
    {
      id: 5,
      title: 'Action Words',
      solution: [
        ['R', 'A', 'M'],
        ['U', null, 'A'],
        ['N', 'A', 'P']
      ],
      prefilled: [[0, 0], [2, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Male sheep', textZh: '公羊' },
          { num: 3, row: 2, col: 0, text: 'Short sleep', textZh: '小睡' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Move fast', textZh: '跑' },
          { num: 2, row: 0, col: 2, text: 'Shows directions', textZh: '地图' }
        ]
      }
    },
    
    // Puzzle 6: CAB, COW, WET, BET
    // C A B
    // O . E
    // W E T
    {
      id: 6,
      title: 'Farm Animals',
      solution: [
        ['C', 'A', 'B'],
        ['O', null, 'E'],
        ['W', 'E', 'T']
      ],
      prefilled: [[0, 0], [2, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Taxi', textZh: '出租车' },
          { num: 3, row: 2, col: 0, text: 'Covered in water', textZh: '湿的' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Farm animal', textZh: '奶牛' },
          { num: 2, row: 0, col: 2, text: 'Make a wager', textZh: '打赌' }
        ]
      }
    },
    
    // Puzzle 7: AIR, ARM, RUG, MUG
    // A R M
    // I . U
    // R U G
    // Words: ARM, RUG (across), AIR, MUG (down) - all valid!
    {
      id: 7,
      title: 'Body Parts',
      solution: [
        ['A', 'R', 'M'],
        ['I', null, 'U'],
        ['R', 'U', 'G']
      ],
      prefilled: [[0, 0], [2, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Limb with hand', textZh: '手臂' },
          { num: 3, row: 2, col: 0, text: 'Floor covering', textZh: '地毯' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'What we breathe', textZh: '空气' },
          { num: 2, row: 0, col: 2, text: 'Drinking cup', textZh: '马克杯' }
        ]
      }
    },
    
    // Puzzle 8: AGE, ANT, EAR, GET
    // A G E
    // N . A
    // T . R
    // Words: AGE (across), ANT (down), EAR (down) - wait, GET doesn't work
    // Let's use: AGE, ANT, EAT, ATE
    // A T E
    // G . A
    // E . R
    // Words: ATE (across), AGE (down), EAR (down)
    {
      id: 8,
      title: 'Little Things',
      solution: [
        ['A', 'T', 'E'],
        ['G', null, 'A'],
        ['E', null, 'R']
      ],
      prefilled: [[0, 0], [0, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Past of eat', textZh: '吃的过去式' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'How old you are', textZh: '年龄' },
          { num: 2, row: 0, col: 2, text: 'Hearing organ', textZh: '耳朵' }
        ]
      }
    },
    
    // Puzzle 9: PAN, POT, NUT, ANT
    // P A N
    // O . U
    // T A T
    // Wait, TAT isn't ideal. Let's try:
    // P O T
    // A . A
    // N U T
    // Words: POT, NUT (across), PAN, TAT (down) - TAT is a word (make lace)
    {
      id: 9,
      title: 'Kitchen Stuff',
      solution: [
        ['P', 'O', 'T'],
        ['A', null, 'A'],
        ['N', 'U', 'T']
      ],
      prefilled: [[0, 0], [2, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Cooking container', textZh: '锅' },
          { num: 3, row: 2, col: 0, text: 'Hard-shelled snack', textZh: '坚果' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Flat cooking vessel', textZh: '平底锅' },
          { num: 2, row: 0, col: 2, text: 'Make lace; cheap', textZh: '编织花边' }
        ]
      }
    },
    
    // Puzzle 10: TOP, TIP, PIT, POP
    // T O P
    // I . I
    // P O P
    // Words: TOP, POP (across), TIP, POP (down) - wait, TIP and PIP
    // Actually column 0: TIP, column 2: PIP (a seed - valid!)
    {
      id: 10,
      title: 'Fun Outside',
      solution: [
        ['T', 'O', 'P'],
        ['I', null, 'I'],
        ['P', 'O', 'P']
      ],
      prefilled: [[0, 0], [2, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Highest point', textZh: '顶部' },
          { num: 3, row: 2, col: 0, text: 'Burst sound', textZh: '砰' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Helpful hint', textZh: '小费；提示' },
          { num: 2, row: 0, col: 2, text: 'Fruit seed', textZh: '果核' }
        ]
      }
    }
  ],
  
  intermediate: [
    // ═══════════════════════════════════════════════════════════════
    // INTERMEDIATE PUZZLES (10) - 4-5 letter words
    // ═══════════════════════════════════════════════════════════════
    
    // Puzzle 1: STAR, RAIN, SUN, AIR
    // S T A R
    // . . I .
    // S U N .
    // . . .
    // Better layout:
    // S T A R
    // U . I .
    // N . R .
    // Words: STAR (across), SUN (down), AIR (down)
    {
      id: 1,
      title: 'Nature Scene',
      solution: [
        ['S', 'T', 'A', 'R'],
        ['U', null, 'I', null],
        ['N', null, 'R', null]
      ],
      prefilled: [[0, 0], [0, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Night sky light', textZh: '星星' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Bright star in sky', textZh: '太阳' },
          { num: 2, row: 0, col: 2, text: 'What we breathe', textZh: '空气' }
        ]
      }
    },
    
    // Puzzle 2: WATER, LAKE, WAVE, RICE  
    // W A T E R
    // A . . . I
    // V . . . C
    // E L A K E
    // Words: WATER, LAKE (valid across - wait ELAKE isn't a word)
    // Fix: 
    // W A V E
    // A . . .
    // T . . .
    // E L A K E - no that's ELAKE
    // Let's do simpler:
    // W A V E
    // A . . .
    // T . . .
    // E R A .
    // R . . .
    // Actually let's simplify: LAKE, WAVE, LAKE, WAVE intersecting on A
    // L A K E
    // . . . .
    // W A V E
    // . . . .
    // Better: LAKE, WAKE, LOVE, WAKE
    // Actually let's do:
    // L A K E
    // O . . A
    // V . . T
    // E A T S
    // Words: LAKE, EATS (across), LOVE, EATS (down) - wait EAT column
    // Simpler 4x4:
    // L A K E
    // O . . .
    // V . . .
    // E D G E
    // Words: LAKE, EDGE (across), LOVE (down) - valid!
    {
      id: 2,
      title: 'Water World',
      solution: [
        ['L', 'A', 'K', 'E'],
        ['O', null, null, null],
        ['V', null, null, null],
        ['E', 'D', 'G', 'E']
      ],
      prefilled: [[0, 0], [3, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Body of fresh water', textZh: '湖' },
          { num: 2, row: 3, col: 0, text: 'Border; rim', textZh: '边缘' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Deep affection', textZh: '爱' }
        ]
      }
    },
    
    // Puzzle 3: BEAR, BIRD, ROAD, DOOR
    // B E A R
    // I . O .
    // R . A .
    // D O O R
    // Words: BEAR, DOOR (across), BIRD, ROAD (down) - need to check OA column
    // Actually that creates OAO in column 2 - not a word by itself
    // Let me verify: columns are BIRD (valid), E.O. (not continuous), ROAD? No - AO.OO
    // Let's redo:
    // B I R D
    // E . O .
    // A . A .
    // R O A D
    // Words: BIRD, ROAD (across), BEAR, ROAD (down) - but column 2 is ROAD also? R-O-A-D yes!
    // Wait column 0 is BEAR, column 2 is ROAD - duplicate theme but valid
    {
      id: 3,
      title: 'Animal Kingdom',
      solution: [
        ['B', 'I', 'R', 'D'],
        ['E', null, 'O', null],
        ['A', null, 'A', null],
        ['R', null, 'D', null]
      ],
      prefilled: [[0, 0], [0, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Feathered flyer', textZh: '鸟' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Large furry mammal', textZh: '熊' },
          { num: 2, row: 0, col: 2, text: 'Path for cars', textZh: '公路' }
        ]
      }
    },
    
    // Puzzle 4: DOOR, DESK, SOFA
    // D O O R
    // E . . .
    // S O F A
    // K . . .
    // Words: DOOR, SOFA (across), DESK (down) - valid!
    {
      id: 4,
      title: 'Home Sweet Home',
      solution: [
        ['D', 'O', 'O', 'R'],
        ['E', null, null, null],
        ['S', 'O', 'F', 'A'],
        ['K', null, null, null]
      ],
      prefilled: [[0, 0], [2, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Room entrance', textZh: '门' },
          { num: 2, row: 2, col: 0, text: 'Living room seat', textZh: '沙发' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Work table', textZh: '桌子' }
        ]
      }
    },
    
    // Puzzle 5: TREE, LEAF, AREA (intersecting)
    // T R E E
    // . . A .
    // L E A F
    // . . . .
    // Words: TREE, LEAF (across), EA, EA, A... hmm column 2 is E-A-A which isn't a word
    // Fix:
    // L E A F
    // . . R .
    // T R E E
    // . . A .
    // Words: LEAF, TREE (across), AREA (down) - valid!
    {
      id: 5,
      title: 'Garden Life',
      solution: [
        ['L', 'E', 'A', 'F'],
        [null, null, 'R', null],
        ['T', 'R', 'E', 'E'],
        [null, null, 'A', null]
      ],
      prefilled: [[0, 0], [2, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Part of a tree', textZh: '树叶' },
          { num: 2, row: 2, col: 0, text: 'Tall plant with trunk', textZh: '树' }
        ],
        down: [
          { num: 3, row: 0, col: 2, text: 'Region or zone', textZh: '区域' }
        ]
      }
    },
    
    // Puzzle 6: FOOD, CAKE, BAKE
    // F O O D
    // . . . .
    // C A K E
    // . . . .
    // B A K E
    // Words: FOOD, CAKE, BAKE (all across) - valid! No bad columns.
    {
      id: 6,
      title: 'Meal Time',
      solution: [
        ['F', 'O', 'O', 'D'],
        [null, null, null, null],
        ['C', 'A', 'K', 'E'],
        [null, null, null, null],
        ['B', 'A', 'K', 'E']
      ],
      prefilled: [[0, 0], [2, 0], [4, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'What you eat', textZh: '食物' },
          { num: 2, row: 2, col: 0, text: 'Birthday dessert', textZh: '蛋糕' },
          { num: 3, row: 4, col: 0, text: 'Cook in oven', textZh: '烤' }
        ],
        down: []
      }
    },
    
    // Puzzle 7: WALK, WORK, READ
    // W A L K
    // O . . .
    // R E A D
    // K . . .
    // Words: WALK, READ (across), WORK (down) - valid!
    {
      id: 7,
      title: 'Daily Actions',
      solution: [
        ['W', 'A', 'L', 'K'],
        ['O', null, null, null],
        ['R', 'E', 'A', 'D'],
        ['K', null, null, null]
      ],
      prefilled: [[0, 0], [2, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Move on foot', textZh: '步行' },
          { num: 2, row: 2, col: 0, text: 'Look at words', textZh: '阅读' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Job; labor', textZh: '工作' }
        ]
      }
    },
    
    // Puzzle 8: MOON, COLD, CLOUD
    // C L O U D
    // O . . . .
    // L . . . .
    // D . . . .
    // Not enough intersection. Better:
    // C O L D
    // L . . .
    // O . . .
    // U . . .
    // D . M O O N
    // Hmm, let's do:
    // M O O N
    // . . . .
    // C O L D
    // Words: MOON, COLD (across) - but no down words crossing
    // Let me try:
    // C O L D
    // . O . .
    // M O O N
    // . N . .
    // Words: COLD, MOON (across), MOON (down col 1) - valid but same word twice
    // Better:
    // M O O N
    // O . . .
    // O . . .
    // D A R K
    // Words: MOON, DARK (across), MOOD (down) - valid!
    {
      id: 8,
      title: 'Sky Above',
      solution: [
        ['M', 'O', 'O', 'N'],
        ['O', null, null, null],
        ['O', null, null, null],
        ['D', 'A', 'R', 'K']
      ],
      prefilled: [[0, 0], [3, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Night sky circle', textZh: '月亮' },
          { num: 2, row: 3, col: 0, text: 'No light', textZh: '黑暗' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Emotional state', textZh: '心情' }
        ]
      }
    },
    
    // Puzzle 9: HELP, HAPPY, PLAY
    // H A P P Y
    // E . L . .
    // L . A . .
    // P . Y . .
    // Words: HAPPY (across), HELP (down), PLAY (down) - valid!
    {
      id: 9,
      title: 'Feelings',
      solution: [
        ['H', 'A', 'P', 'P', 'Y'],
        ['E', null, 'L', null, null],
        ['L', null, 'A', null, null],
        ['P', null, 'Y', null, null]
      ],
      prefilled: [[0, 0], [0, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Feeling joy', textZh: '快乐的' }
        ],
        down: [
          { num: 1, row: 0, col: 0, text: 'Give assistance', textZh: '帮助' },
          { num: 2, row: 0, col: 2, text: 'Have fun', textZh: '玩' }
        ]
      }
    },
    
    // Puzzle 10: GAME, SWIM, WISE
    // G A M E
    // . . . .
    // S W I M
    // . I . .
    // . S . .
    // . E . .
    // Words: GAME, SWIM (across), WISE (down) - valid!
    {
      id: 10,
      title: 'Fun Activities',
      solution: [
        ['G', 'A', 'M', 'E'],
        [null, null, null, null],
        ['S', 'W', 'I', 'M'],
        [null, 'I', null, null],
        [null, 'S', null, null],
        [null, 'E', null, null]
      ],
      prefilled: [[0, 0], [2, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Fun activity', textZh: '游戏' },
          { num: 2, row: 2, col: 0, text: 'Move in water', textZh: '游泳' }
        ],
        down: [
          { num: 3, row: 2, col: 1, text: 'Having knowledge', textZh: '聪明的' }
        ]
      }
    }
  ],
  
  advanced: [
    // ═══════════════════════════════════════════════════════════════
    // ADVANCED PUZZLES (10) - 5-8 letter words
    // ═══════════════════════════════════════════════════════════════
    
    // Puzzle 1: MOUNTAIN, OCEAN, ISLAND
    // M O U N T A I N
    // . C . . . . . .
    // . E . . . . . .
    // . A . . . . . .
    // . N . . . . . .
    // Words: MOUNTAIN (across), OCEAN (down) - valid!
    {
      id: 1,
      title: 'Around the World',
      solution: [
        ['M', 'O', 'U', 'N', 'T', 'A', 'I', 'N'],
        [null, 'C', null, null, null, null, null, null],
        [null, 'E', null, null, null, null, null, null],
        [null, 'A', null, null, null, null, null, null],
        [null, 'N', null, null, null, null, null, null]
      ],
      prefilled: [[0, 0], [0, 1]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Very tall hill', textZh: '山' }
        ],
        down: [
          { num: 2, row: 0, col: 1, text: 'Vast salty sea', textZh: '海洋' }
        ]
      }
    },
    
    // Puzzle 2: COMPUTER, KEYBOARD, SCREEN
    // C O M P U T E R
    // . . . . . . . .
    // K E Y B O A R D
    // . . . . . . . .
    // S C R E E N . .
    // Words: COMPUTER, KEYBOARD, SCREEN (all across) - valid!
    {
      id: 2,
      title: 'Technology',
      solution: [
        ['C', 'O', 'M', 'P', 'U', 'T', 'E', 'R'],
        [null, null, null, null, null, null, null, null],
        ['K', 'E', 'Y', 'B', 'O', 'A', 'R', 'D'],
        [null, null, null, null, null, null, null, null],
        ['S', 'C', 'R', 'E', 'E', 'N', null, null]
      ],
      prefilled: [[0, 0], [2, 0], [4, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Digital machine', textZh: '电脑' },
          { num: 2, row: 2, col: 0, text: 'Typing tool', textZh: '键盘' },
          { num: 3, row: 4, col: 0, text: 'Display monitor', textZh: '屏幕' }
        ],
        down: []
      }
    },
    
    // Puzzle 3: TEACHER, STUDENT, SCHOOL
    // T E A C H E R
    // . . . . . . .
    // S C H O O L .
    // T . . . . . .
    // U . . . . . .
    // D . . . . . .
    // E . . . . . .
    // N . . . . . .
    // T . . . . . .
    // Words: TEACHER, SCHOOL (across), STUDENT (down) - valid!
    {
      id: 3,
      title: 'School Days',
      solution: [
        ['T', 'E', 'A', 'C', 'H', 'E', 'R'],
        [null, null, null, null, null, null, null],
        ['S', 'C', 'H', 'O', 'O', 'L', null],
        ['T', null, null, null, null, null, null],
        ['U', null, null, null, null, null, null],
        ['D', null, null, null, null, null, null],
        ['E', null, null, null, null, null, null],
        ['N', null, null, null, null, null, null],
        ['T', null, null, null, null, null, null]
      ],
      prefilled: [[0, 0], [2, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'School instructor', textZh: '老师' },
          { num: 2, row: 2, col: 0, text: 'Place of learning', textZh: '学校' }
        ],
        down: [
          { num: 3, row: 2, col: 0, text: 'Person learning', textZh: '学生' }
        ]
      }
    },
    
    // Puzzle 4: TIGER, GIRAFFE, ELEPHANT
    // T I G E R . . .
    // . . I . . . . .
    // . . R . . . . .
    // . . A . . . . .
    // . . F . . . . .
    // . . F . . . . .
    // E L E P H A N T
    // Words: TIGER, ELEPHANT (across), GIRAFFE (down) - valid!
    {
      id: 4,
      title: 'Animal Safari',
      solution: [
        ['T', 'I', 'G', 'E', 'R', null, null, null],
        [null, null, 'I', null, null, null, null, null],
        [null, null, 'R', null, null, null, null, null],
        [null, null, 'A', null, null, null, null, null],
        [null, null, 'F', null, null, null, null, null],
        [null, null, 'F', null, null, null, null, null],
        ['E', 'L', 'E', 'P', 'H', 'A', 'N', 'T']
      ],
      prefilled: [[0, 0], [6, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Striped big cat', textZh: '老虎' },
          { num: 2, row: 6, col: 0, text: 'Large trunk animal', textZh: '大象' }
        ],
        down: [
          { num: 3, row: 0, col: 2, text: 'Long-necked animal', textZh: '长颈鹿' }
        ]
      }
    },
    
    // Puzzle 5: SUNSHINE, RAINBOW, STORM
    // S U N S H I N E
    // T . . . . . . .
    // O . . . . . . .
    // R A I N B O W .
    // M . . . . . . .
    // Words: SUNSHINE, RAINBOW (across), STORM (down) - valid!
    {
      id: 5,
      title: 'Weather Report',
      solution: [
        ['S', 'U', 'N', 'S', 'H', 'I', 'N', 'E'],
        ['T', null, null, null, null, null, null, null],
        ['O', null, null, null, null, null, null, null],
        ['R', 'A', 'I', 'N', 'B', 'O', 'W', null],
        ['M', null, null, null, null, null, null, null]
      ],
      prefilled: [[0, 0], [3, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Light from sun', textZh: '阳光' },
          { num: 2, row: 3, col: 0, text: 'Colorful sky arc', textZh: '彩虹' }
        ],
        down: [
          { num: 3, row: 0, col: 0, text: 'Bad weather', textZh: '暴风雨' }
        ]
      }
    },
    
    // Puzzle 6: CHOCOLATE, COOKIE, HONEY
    // C H O C O L A T E
    // . O . . . . . . .
    // . N . . . . . . .
    // . E . . . . . . .
    // . Y . . . . . . .
    // Words: CHOCOLATE (across), HONEY (down) - valid!
    {
      id: 6,
      title: 'Sweet Treats',
      solution: [
        ['C', 'H', 'O', 'C', 'O', 'L', 'A', 'T', 'E'],
        [null, 'O', null, null, null, null, null, null, null],
        [null, 'N', null, null, null, null, null, null, null],
        [null, 'E', null, null, null, null, null, null, null],
        [null, 'Y', null, null, null, null, null, null, null]
      ],
      prefilled: [[0, 0], [0, 1]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Sweet brown treat', textZh: '巧克力' }
        ],
        down: [
          { num: 2, row: 0, col: 1, text: 'Bee product', textZh: '蜂蜜' }
        ]
      }
    },
    
    // Puzzle 7: BROTHER, SISTER, FATHER
    // B R O T H E R
    // . . . . . . .
    // S I S T E R .
    // . . . . . . .
    // F A T H E R .
    // Words: BROTHER, SISTER, FATHER (all across) - valid!
    {
      id: 7,
      title: 'Family Time',
      solution: [
        ['B', 'R', 'O', 'T', 'H', 'E', 'R'],
        [null, null, null, null, null, null, null],
        ['S', 'I', 'S', 'T', 'E', 'R', null],
        [null, null, null, null, null, null, null],
        ['F', 'A', 'T', 'H', 'E', 'R', null]
      ],
      prefilled: [[0, 0], [2, 0], [4, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Male sibling', textZh: '兄弟' },
          { num: 2, row: 2, col: 0, text: 'Female sibling', textZh: '姐妹' },
          { num: 3, row: 4, col: 0, text: 'Male parent', textZh: '父亲' }
        ],
        down: []
      }
    },
    
    // Puzzle 8: BUTTERFLY, SPIDER, BEETLE
    // B U T T E R F L Y
    // . . . . . . . . .
    // B E E T L E . . .
    // . . . . . . . . .
    // S P I D E R . . .
    // Words: BUTTERFLY, BEETLE, SPIDER (all across) - valid!
    {
      id: 8,
      title: 'Insect World',
      solution: [
        ['B', 'U', 'T', 'T', 'E', 'R', 'F', 'L', 'Y'],
        [null, null, null, null, null, null, null, null, null],
        ['B', 'E', 'E', 'T', 'L', 'E', null, null, null],
        [null, null, null, null, null, null, null, null, null],
        ['S', 'P', 'I', 'D', 'E', 'R', null, null, null]
      ],
      prefilled: [[0, 0], [2, 0], [4, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Colorful winged insect', textZh: '蝴蝶' },
          { num: 2, row: 2, col: 0, text: 'Hard-shelled bug', textZh: '甲虫' },
          { num: 3, row: 4, col: 0, text: 'Eight-legged crawler', textZh: '蜘蛛' }
        ],
        down: []
      }
    },
    
    // Puzzle 9: KITCHEN, BEDROOM, LIVING
    // K I T C H E N
    // . . . . . . .
    // B E D R O O M
    // . . . . . . .
    // L I V I N G .
    // Words: KITCHEN, BEDROOM, LIVING (all across) - valid!
    {
      id: 9,
      title: 'Home Rooms',
      solution: [
        ['K', 'I', 'T', 'C', 'H', 'E', 'N'],
        [null, null, null, null, null, null, null],
        ['B', 'E', 'D', 'R', 'O', 'O', 'M'],
        [null, null, null, null, null, null, null],
        ['L', 'I', 'V', 'I', 'N', 'G', null]
      ],
      prefilled: [[0, 0], [2, 0], [4, 0]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Cooking room', textZh: '厨房' },
          { num: 2, row: 2, col: 0, text: 'Sleeping room', textZh: '卧室' },
          { num: 3, row: 4, col: 0, text: '_____ room (family room)', textZh: '客厅' }
        ],
        down: []
      }
    },
    
    // Puzzle 10: TOMORROW, MORNING, EVENING
    // T O M O R R O W
    // . . O . . . . .
    // . . R . . . . .
    // . . N . . . . .
    // . . I . . . . .
    // . . N . . . . .
    // . . G . . . . .
    // Words: TOMORROW (across), MORNING (down) - valid!
    {
      id: 10,
      title: 'Time Travel',
      solution: [
        ['T', 'O', 'M', 'O', 'R', 'R', 'O', 'W'],
        [null, null, 'O', null, null, null, null, null],
        [null, null, 'R', null, null, null, null, null],
        [null, null, 'N', null, null, null, null, null],
        [null, null, 'I', null, null, null, null, null],
        [null, null, 'N', null, null, null, null, null],
        [null, null, 'G', null, null, null, null, null]
      ],
      prefilled: [[0, 0], [0, 2]],
      clues: {
        across: [
          { num: 1, row: 0, col: 0, text: 'Day after today', textZh: '明天' }
        ],
        down: [
          { num: 2, row: 0, col: 2, text: 'Start of day', textZh: '早晨' }
        ]
      }
    }
  ]
}

module.exports = { LEVELS, PUZZLES }
