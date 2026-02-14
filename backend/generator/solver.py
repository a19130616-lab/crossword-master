#!/usr/bin/env python3
"""Crossword backtracking solver with trie-based lookup."""

import argparse
import json
import random
from pathlib import Path

from grid_templates import get_templates

ROOT = Path(__file__).resolve().parents[2]
DICT_PATH = ROOT / "backend" / "dictionary" / "word_dictionary.json"


class TrieNode:
    __slots__ = ("children", "is_word")

    def __init__(self):
        self.children = {}
        self.is_word = False


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_word = True

    def search_pattern(self, pattern):
        """Return all words matching pattern list of chars/None."""
        results = []
        length = len(pattern)

        def dfs(node, idx, buf):
            if idx == length:
                if node.is_word:
                    results.append("".join(buf))
                return
            ch = pattern[idx]
            if ch is None:
                for nxt, child in node.children.items():
                    buf.append(nxt)
                    dfs(child, idx + 1, buf)
                    buf.pop()
            else:
                child = node.children.get(ch)
                if child:
                    buf.append(ch)
                    dfs(child, idx + 1, buf)
                    buf.pop()

        dfs(self.root, 0, [])
        return results


def load_dictionary():
    if not DICT_PATH.exists():
        raise FileNotFoundError(f"Dictionary not found: {DICT_PATH}")
    data = json.loads(DICT_PATH.read_text(encoding="utf-8"))
    words = [w.upper() for w in data.get("words", {}).keys()]
    return words


def build_tries(words):
    tries = {}
    for w in words:
        tries.setdefault(len(w), Trie()).insert(w)
    return tries


def parse_grid(template, size=None):
    rows = [list(row) for row in template]
    max_len = max((len(r) for r in rows), default=0)
    target = size or max(len(rows), max_len)
    # pad rows to target
    for r in rows:
        if len(r) < target:
            r.extend(['#'] * (target - len(r)))
    # pad missing rows
    while len(rows) < target:
        rows.append(['#'] * target)
    return rows


def run_length(grid, r, c, dr, dc):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    length = 0
    rr, cc = r, c
    while 0 <= rr < rows and 0 <= cc < cols and grid[rr][cc] != '#':
        length += 1
        rr += dr
        cc += dc
    return length


def cell_word_lengths(grid, r, c):
    cc = c
    while cc > 0 and grid[r][cc - 1] != '#':
        cc -= 1
    across = run_length(grid, r, cc, 0, 1)
    rr = r
    while rr > 0 and grid[rr - 1][c] != '#':
        rr -= 1
    down = run_length(grid, rr, c, 1, 0)
    return across, down


def sanitize_grid(grid):
    changed = True
    while changed:
        changed = False
        rows = len(grid)
        cols = len(grid[0]) if rows else 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == '#':
                    continue
                across, down = cell_word_lengths(grid, r, c)
                if across < 3 and down < 3:
                    grid[r][c] = '#'
                    changed = True
    return grid


def is_connected(grid):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    whites = [(r, c) for r in range(rows) for c in range(cols) if grid[r][c] != '#']
    if not whites:
        return False
    stack = [whites[0]]
    seen = set(stack)
    while stack:
        r, c = stack.pop()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            rr, cc = r + dr, c + dc
            if 0 <= rr < rows and 0 <= cc < cols and grid[rr][cc] != '#':
                if (rr, cc) not in seen:
                    seen.add((rr, cc))
                    stack.append((rr, cc))
    return len(seen) == len(whites)


def extract_slots(grid):
    slots = []
    rows = len(grid)
    cols = len(grid[0]) if rows else 0

    # Across slots
    for r in range(rows):
        c = 0
        while c < cols:
            if grid[r][c] == '#':
                c += 1
                continue
            start = c
            while c < cols and grid[r][c] != '#':
                c += 1
            length = c - start
            if length >= 3:
                positions = [(r, cc) for cc in range(start, c)]
                slots.append({"dir": "across", "positions": positions, "length": length})
    # Down slots
    for c in range(cols):
        r = 0
        while r < rows:
            if grid[r][c] == '#':
                r += 1
                continue
            start = r
            while r < rows and grid[r][c] != '#':
                r += 1
            length = r - start
            if length >= 3:
                positions = [(rr, c) for rr in range(start, r)]
                slots.append({"dir": "down", "positions": positions, "length": length})
    return slots


def get_pattern(grid, slot):
    pattern = []
    for r, c in slot["positions"]:
        ch = grid[r][c]
        if ch == '.':
            pattern.append(None)
        else:
            pattern.append(ch)
    return pattern


def place_word(grid, slot, word):
    changes = []
    for (r, c), ch in zip(slot["positions"], word):
        cur = grid[r][c]
        if cur == '.':
            grid[r][c] = ch
            changes.append((r, c))
        elif cur != ch:
            for rr, cc in changes:
                grid[rr][cc] = '.'
            return None
    return changes


def undo_changes(grid, changes):
    for r, c in changes:
        grid[r][c] = '.'


def count_whites(grid):
    return sum(1 for row in grid for ch in row if ch != '#')


def count_words_by_dir(slots):
    across = sum(1 for s in slots if s["dir"] == "across")
    down = sum(1 for s in slots if s["dir"] == "down")
    return across, down


def validate_full_grid(grid):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '#':
                continue
            across, down = cell_word_lengths(grid, r, c)
            if across < 3 and down < 3:
                return False
    return True


def solve(grid, slots, tries, max_nodes=200000, allow_reuse=False, used_global=None):
    used = set()
    nodes = 0

    def candidates_for(slot):
        trie = tries.get(slot["length"])
        if not trie:
            return []
        pattern = get_pattern(grid, slot)
        words = trie.search_pattern(pattern)
        if not allow_reuse:
            words = [w for w in words if w not in used]
        if used_global:
            words = [w for w in words if w not in used_global]
        random.shuffle(words)
        if len(words) > 500:
            words = words[:500]
        return words

    def backtrack(remaining):
        nonlocal nodes
        nodes += 1
        if nodes > max_nodes:
            return False
        if not remaining:
            return True

        best_idx = None
        best_cands = None
        best_count = None
        for i, slot in enumerate(remaining):
            cands = candidates_for(slot)
            cnt = len(cands)
            if cnt == 0:
                return False
            if best_count is None or cnt < best_count:
                best_count = cnt
                best_idx = i
                best_cands = cands
            if best_count == 1:
                break

        slot = remaining.pop(best_idx)
        for w in best_cands:
            changes = place_word(grid, slot, w)
            if changes is None:
                continue
            if not allow_reuse:
                used.add(w)
            if backtrack(remaining):
                return True
            if not allow_reuse:
                used.remove(w)
            undo_changes(grid, changes)

        remaining.insert(best_idx, slot)
        return False

    return backtrack(slots[:])


def print_grid(grid):
    for row in grid:
        print("".join(row))


def slot_word(grid, slot):
    return "".join(grid[r][c] for r, c in slot["positions"])


def generate_one(templates, tries, size, used_global=None, max_attempts=500):
    for _ in range(max_attempts):
        template = random.choice(templates)
        grid = parse_grid(template, size=size)
        sanitize_grid(grid)
        if not is_connected(grid):
            continue

        slots = extract_slots(grid)
        # skip templates with slot lengths not in dictionary
        if any(s["length"] not in tries for s in slots):
            continue

        across, down = count_words_by_dir(slots)
        total_cells = len(grid) * len(grid[0])
        white_ratio = count_whites(grid) / total_cells

        if size == 5:
            if white_ratio < 0.68:
                continue
            if across < 2 or down < 2:
                continue
        elif size == 7:
            if white_ratio < 0.60:
                continue
            if across < 3 or down < 3:
                continue
        elif size == 9:
            if white_ratio < 0.55:
                continue
            if across < 4 or down < 4:
                continue

        allow_reuse = (size <= 5)
        node_limit = 80000 if size <= 5 else 200000
        ok = solve(grid, slots, tries, allow_reuse=allow_reuse, used_global=used_global, max_nodes=node_limit)
        if ok and validate_full_grid(grid):
            if used_global is not None:
                puzzle_words = {slot_word(grid, s) for s in slots}
                if puzzle_words & used_global:
                    continue
                used_global.update(puzzle_words)
            return grid
    return None


def main():
    parser = argparse.ArgumentParser(description="Crossword solver")
    parser.add_argument("--size", type=int, default=5, help="Grid size (e.g., 5, 7, 10)")
    parser.add_argument("--template", type=int, default=None, help="Template index (optional)")
    parser.add_argument("--count", type=int, default=None, help="How many grids to generate")
    args = parser.parse_args()

    templates = get_templates(args.size)
    if not templates:
        raise SystemExit(f"No templates found for size {args.size}")

    if args.template is not None:
        if args.template < 0 or args.template >= len(templates):
            raise SystemExit(f"Template index out of range (0..{len(templates)-1})")
        templates = [templates[args.template]]

    words = load_dictionary()
    tries = build_tries(words)

    count = args.count
    if count is None:
        count = 5 if args.size == 5 else 1

    used_global = set()
    for i in range(count):
        grid = generate_one(templates, tries, args.size, used_global=used_global)
        if not grid:
            raise SystemExit("Failed to generate a valid grid")
        print_grid(grid)
        if i < count - 1:
            print("")


if __name__ == "__main__":
    main()
