"""Build puzzle JSON from a solved crossword grid."""

import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DICT_PATH = ROOT / "backend" / "dictionary" / "word_dictionary.json"


def load_dictionary():
    data = json.loads(DICT_PATH.read_text(encoding="utf-8"))
    return data.get("words", {})


def is_black(cell):
    return cell == '#'


def to_solution_grid(grid):
    return [[None if is_black(ch) else str(ch).upper() for ch in row] for row in grid]


def extract_words(grid, min_len=3):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    words = []
    num = 1

    def start_of_across(r, c):
        return (c == 0 or grid[r][c - 1] == '#') and (c + 1 < cols and grid[r][c + 1] != '#')

    def start_of_down(r, c):
        return (r == 0 or grid[r - 1][c] == '#') and (r + 1 < rows and grid[r + 1][c] != '#')

    for r in range(rows):
        for c in range(cols):
            if is_black(grid[r][c]):
                continue
            starts_across = start_of_across(r, c)
            starts_down = start_of_down(r, c)
            if not (starts_across or starts_down):
                continue

            if starts_across:
                cc = c
                letters = []
                while cc < cols and grid[r][cc] != '#':
                    letters.append(grid[r][cc])
                    cc += 1
                if len(letters) >= min_len:
                    words.append({
                        "num": num,
                        "dir": "across",
                        "row": r,
                        "col": c,
                        "answer": "".join(letters).upper()
                    })

            if starts_down:
                rr = r
                letters = []
                while rr < rows and grid[rr][c] != '#':
                    letters.append(grid[rr][c])
                    rr += 1
                if len(letters) >= min_len:
                    words.append({
                        "num": num,
                        "dir": "down",
                        "row": r,
                        "col": c,
                        "answer": "".join(letters).upper()
                    })

            num += 1

    return words


def build_puzzle(grid, puzzle_id, title="Generated Puzzle"):
    words_dict = load_dictionary()
    rows = len(grid)
    cols = len(grid[0]) if rows else 0

    words = extract_words(grid)
    clues = {"across": [], "down": []}

    for w in words:
        key = w["answer"].lower()
        entry = words_dict.get(key, {})
        clue_text = entry.get("clues", {}).get("easy", "") if entry else ""
        if not clue_text:
            raise ValueError(f"Missing clue for word: {w['answer']}")
        clues[w["dir"]].append({
            "num": w["num"],
            "row": w["row"],
            "col": w["col"],
            "clue": {
                "en": clue_text,
                "zh": clue_text
            }
        })

    solution = to_solution_grid(grid)
    white_cells = [(r, c) for r in range(rows) for c in range(cols) if solution[r][c] is not None]
    random.shuffle(white_cells)

    def pick(n):
        return white_cells[:n]

    total_white = len(white_cells)
    easy_n = max(1, int(total_white * 0.25))
    med_n = max(1, int(total_white * 0.15))
    hard_n = max(1, int(total_white * 0.08))

    prefilled = {
        "easy": pick(easy_n),
        "medium": pick(med_n),
        "hard": pick(hard_n)
    }

    puzzle = {
        "id": puzzle_id,
        "title": title,
        "rows": rows,
        "cols": cols,
        "solution": solution,
        "prefilled": prefilled,
        "clues": clues
    }
    return puzzle
