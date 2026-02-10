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
    words = list(data.get("words", {}).keys())
    return words


def build_tries(words):
    tries = {}
    for w in words:
        tries.setdefault(len(w), Trie()).insert(w)
    return tries


def parse_grid(template):
    grid = [list(row) for row in template]
    return grid


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
            # conflict
            for rr, cc in changes:
                grid[rr][cc] = '.'
            return None
    return changes


def undo_changes(grid, changes):
    for r, c in changes:
        grid[r][c] = '.'


def solve(grid, slots, tries):
    used = set()

    def candidates_for(slot):
        trie = tries.get(slot["length"])
        if not trie:
            return []
        pattern = get_pattern(grid, slot)
        words = trie.search_pattern(pattern)
        words = [w for w in words if w not in used]
        random.shuffle(words)
        return words

    def backtrack(remaining):
        if not remaining:
            return True

        # MRV: choose slot with fewest candidates
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
            used.add(w)
            if backtrack(remaining):
                return True
            used.remove(w)
            undo_changes(grid, changes)

        remaining.insert(best_idx, slot)
        return False

    return backtrack(slots[:])


def print_grid(grid):
    for row in grid:
        print("".join(row))


def main():
    parser = argparse.ArgumentParser(description="Crossword solver")
    parser.add_argument("--size", type=int, default=5, help="Grid size (e.g., 5, 7, 10)")
    parser.add_argument("--template", type=int, default=0, help="Template index")
    args = parser.parse_args()

    templates = get_templates(args.size)
    if not templates:
        raise SystemExit(f"No templates found for size {args.size}")
    if args.template < 0 or args.template >= len(templates):
        raise SystemExit(f"Template index out of range (0..{len(templates)-1})")

    words = load_dictionary()
    tries = build_tries(words)

    grid = parse_grid(templates[args.template])
    slots = extract_slots(grid)

    ok = solve(grid, slots, tries)
    if not ok:
        raise SystemExit("Failed to solve grid")

    print_grid(grid)


if __name__ == "__main__":
    main()
