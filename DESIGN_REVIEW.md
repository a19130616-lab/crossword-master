# CrossWord Master - Design Review v3.1

## Current Problems

### 1. Puzzle Logic Issues
- **Vocabulary too hard**: CANOE, NOTEBOOK, ELEPHANT are NOT elementary
- **Unnecessary plurals**: CATS, DOGS, TOYS add complexity
- **Pre-filled letters don't help**: Random letters instead of strategic crossings
- **Clue-answer mismatch**: "Small boat" → CANOE is confusing for learners

### 2. Visual Design Issues
- **Pure black cells too harsh**: Creates prison-like feel
- **Low contrast on pre-filled**: Gray on gray hard to read
- **Grid feels cramped**: Numbers overlap with letters
- **No visual hierarchy**: All cells look equally important

### 3. UX Issues
- **No clear starting point**: Where should player begin?
- **Direction unclear**: How do I know if I'm filling across or down?
- **Keyboard might not trigger**: wx.showKeyboard needs user interaction first

---

## Design Solutions

### 1. Proper Elementary Vocabulary (5x5 grid)
```
Words to use:
- 3 letters: CAT, DOG, SUN, PEN, RED, BIG, RUN, EAT, HAT, CUP
- 4 letters: BOOK, FISH, BIRD, CAKE, TREE, BALL, MILK, STAR
- 5 letters: APPLE, WATER, HAPPY, SMILE

Sample 5x5:
    B O O K ■
    I ■ ■ I ■  
    R U N T ■
    D ■ ■ E ■
    ■ S U N ■

Across:
1. BOOK - You read this
3. RUN - Move fast with legs  
5. SUN - Yellow in the sky

Down:
1. BIRD - Animal with wings
2. KITE - Flies in wind
```

### 2. Visual Improvements
- **Black cells**: Use dark charcoal (#2C2C2E) with subtle rounded corners
- **Selected cell**: Blue border instead of fill (keeps letter visible)
- **Current word highlight**: Very light blue tint
- **Pre-filled letters**: Slightly darker, with subtle background
- **Cell numbers**: Smaller, top-left, don't overlap letters
- **More padding**: Cells need breathing room

### 3. Color Palette (iOS-inspired but softer)
```
Background:     #F5F5F7 (warm gray)
Surface:        #FFFFFF
Black cells:    #3A3A3C (softer than pure black)
Cell border:    #D1D1D6 (subtle)
Selected:       #007AFF border, #E5F2FF fill
Word highlight: #F0F7FF
Pre-filled bg:  #E8E8ED
Text:           #1C1C1E
Text secondary: #636366
Primary blue:   #007AFF
Success green:  #30D158
```

### 4. Better Clue Format
- Show clue number prominently
- Direction indicator (→ or ↓)
- English hint on first line
- Chinese hint below (smaller, optional)

---

## Implementation Plan

1. Create 3 simple 5x5 puzzles with real elementary words
2. Redesign grid with softer colors
3. Fix pre-fill logic: only pre-fill 2-3 strategic letters
4. Add direction indicator on selected cell
5. Test keyboard input flow
6. Review visually before commit

Let me implement this now.
