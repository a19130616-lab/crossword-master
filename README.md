# Crossword Master

A bilingual (English/Chinese) crossword puzzle game built as a WeChat Mini Program, with a Python-based puzzle generation backend.

## Project Structure

```
crossword-master/
├── backend/                    # Puzzle generation pipeline (Python)
│   ├── dictionary/
│   │   ├── build_dictionary.py        # Build word_dictionary.json from enriched data
│   │   ├── translation_overrides.json # Manual fixes for bad auto-translations
│   │   └── word_dictionary.json       # Final dictionary (auto-generated)
│   ├── generator/
│   │   ├── grid_templates.py          # Grid layouts for 5x5, 7x7, 9x9
│   │   ├── puzzle_builder.py          # Convert solved grids to puzzle JSON
│   │   └── solver.py                  # Backtracking solver with trie-based lookup
│   ├── scripts/
│   │   ├── fetch_words.py             # Source words from Google 10K frequency list
│   │   ├── raw_words.txt              # Raw word list (~6K words)
│   │   ├── enricher.py                # Enrich words with EN definitions + ZH translations
│   │   ├── enriched_words.json        # Enriched word bank (auto-generated)
│   │   ├── translate_words.py         # One-time EN→ZH word-level translation
│   │   └── word_translations.json     # Word translations (auto-generated)
│   └── generate.py                    # Main entry: generate 30 puzzles across 3 tiers
├── miniprogram/                # WeChat Mini Program (JavaScript, canvas-based)
│   ├── game.js                        # Entry point, touch handling, game loop
│   ├── js/
│   │   ├── state.js                   # Game state and persistence
│   │   ├── renderer.js                # Canvas rendering for all screens
│   │   ├── puzzle_engine.js           # Puzzle logic (cell selection, input, completion)
│   │   ├── layout.js                  # Responsive layout calculations
│   │   ├── theme.js                   # Colors and fonts
│   │   └── utils.js                   # Touch/rect utilities
│   └── puzzles/                       # Generated puzzle JSONs (30 total)
│       ├── index.json
│       └── puzzle_001.json ... puzzle_030.json
└── scripts/                    # Legacy JS-based generation (deprecated)
```

## Word Pipeline

```
fetch_words.py → raw_words.txt → enricher.py → enriched_words.json
                                                       ↓
                                 translate_words.py → word_translations.json
                                                       ↓
                       build_dictionary.py (+ translation_overrides.json)
                                                       ↓
                                              word_dictionary.json
                                                       ↓
                                    generate.py → puzzle JSONs
```

1. **fetch_words.py** — Downloads ~6K common English words from Google's 10K frequency list
2. **enricher.py** — Fetches English definitions (Dictionary API) and Chinese translations (Google Translate) for each word. Supports incremental/batch processing with checkpoints
3. **translate_words.py** — Creates word-level EN→ZH translations (e.g., APPLE → 苹果) as opposed to definition translations
4. **build_dictionary.py** — Combines all sources, applies filters (profanity, proper nouns, brands, abbreviations, function words), deduplicates plurals and inflected forms, outputs the final dictionary
5. **generate.py** — Uses the solver to generate 30 crossword puzzles (10 easy/5x5, 10 medium/7x7, 10 hard/9x9)

## Dictionary Quality Filters

`build_dictionary.py` applies multiple layers of quality control:

- **Exclusion list**: profanity, proper nouns (84 names), place names, brand names, abbreviations, non-words, function words (~170 total exclusions)
- **Plural dedup**: if both WALK and WALKS exist, keeps only WALK
- **Inflected dedup**: if WALKING has the same Chinese translation as WALK, keeps only WALK
- **Translation priority**: manual override > word-level translation > definition translation
- **Result**: ~4,800 clean, crossword-suitable words with bilingual clues

## Usage

### Generate puzzles

```bash
# Build/rebuild the dictionary
cd backend/dictionary && python3 build_dictionary.py

# Generate all 30 puzzles (10 per difficulty)
cd backend && python3 generate.py

# Generate specific size
cd backend/generator && python3 solver.py --size 7 --count 5
```

### Enrich new words

```bash
# Add new words to raw_words.txt, then:
cd backend/scripts
python3 enricher.py              # enrich all new words
python3 enricher.py --batch 500  # enrich 500 at a time
python3 translate_words.py       # translate all new words
```

### Run the Mini Program

Open the `miniprogram/` directory in [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) and compile.

## Game Features

- 3 difficulty levels: Easy (5x5), Medium (7x7), Hard (9x9)
- 10 puzzles per difficulty (30 total)
- Bilingual clues (English definitions + Chinese translations)
- Language toggle (EN/ZH) on the menu screen
- On-screen keyboard with backspace and direction toggle
- Completion tracking with time display
- Touch scrolling in puzzle list
