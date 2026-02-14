#!/usr/bin/env python3
"""Generate crossword puzzles using the solver and puzzle builder."""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend" / "generator"))

from solver import generate_one, build_tries, load_dictionary  # type: ignore
from grid_templates import get_templates  # type: ignore
from puzzle_builder import build_puzzle  # type: ignore


DIFFICULTY_TIERS = [
    {"size": 5, "difficulty": "easy",   "count": 10, "label": "Easy"},
    {"size": 7, "difficulty": "medium", "count": 10, "label": "Medium"},
    {"size": 9, "difficulty": "hard",   "count": 10, "label": "Hard"},
]


def main():
    parser = argparse.ArgumentParser(description="Generate crossword puzzles")
    parser.add_argument("--size", type=int, default=None, help="Grid size (omit for multi-size generation)")
    parser.add_argument("--count", type=int, default=None, help="Number of puzzles per size")
    parser.add_argument("--output", type=str, default=str(ROOT / "miniprogram" / "puzzles"), help="Output directory")
    args = parser.parse_args()

    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)

    words = load_dictionary()
    tries = build_tries(words)

    # Build the list of tiers to generate
    if args.size is not None:
        # Single-size mode (backward compatible)
        count = args.count or 5
        tiers = [{"size": args.size, "difficulty": "custom", "count": count, "label": "Custom"}]
    else:
        tiers = DIFFICULTY_TIERS
        if args.count is not None:
            tiers = [dict(t, count=args.count) for t in tiers]

    used_global = None
    manifest = []
    puzzle_num = 0

    for tier in tiers:
        size = tier["size"]
        difficulty = tier["difficulty"]
        templates = get_templates(size)
        if not templates:
            print(f"Warning: No templates for size {size}, skipping {difficulty} tier")
            continue

        for i in range(tier["count"]):
            puzzle_num += 1
            grid = None
            for _ in range(200):
                grid = generate_one(templates, tries, size, used_global=used_global, max_attempts=10)
                if grid:
                    break
            if not grid:
                raise SystemExit(f"Failed to generate {difficulty} puzzle {i+1} (size {size})")
            puzzle_id = f"puzzle_{puzzle_num:03d}"
            title = f"{tier['label']} #{i+1}"
            puzzle = build_puzzle(grid, puzzle_id, title=title)
            puzzle["difficulty"] = difficulty
            puzzle["gridSize"] = size
            out_path = out_dir / f"{puzzle_id}.json"
            out_path.write_text(json.dumps(puzzle, ensure_ascii=False, indent=2), encoding="utf-8")
            manifest.append({
                "id": puzzle_id,
                "title": title,
                "difficulty": difficulty,
                "gridSize": size,
                "file": f"puzzles/{puzzle_id}.json"
            })
            print(f"  [{difficulty}] {puzzle_id} ({size}x{size})")

    index_path = out_dir / "index.json"
    index_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nGenerated {puzzle_num} puzzles to {out_dir}")


if __name__ == "__main__":
    main()
