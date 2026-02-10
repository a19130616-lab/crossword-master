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


def main():
    parser = argparse.ArgumentParser(description="Generate crossword puzzles")
    parser.add_argument("--size", type=int, default=5, help="Grid size")
    parser.add_argument("--count", type=int, default=5, help="Number of puzzles")
    parser.add_argument("--output", type=str, default=str(ROOT / "miniprogram" / "puzzles"), help="Output directory")
    args = parser.parse_args()

    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)

    templates = get_templates(args.size)
    if not templates:
        raise SystemExit(f"No templates for size {args.size}")

    words = load_dictionary()
    tries = build_tries(words)

    used_global = set()
    for i in range(args.count):
        grid = generate_one(templates, tries, args.size, used_global=used_global)
        if not grid:
            raise SystemExit("Failed to generate a valid grid")
        puzzle_id = f"puzzle_{i+1:03d}"
        puzzle = build_puzzle(grid, puzzle_id)
        out_path = out_dir / f"{puzzle_id}.json"
        out_path.write_text(json.dumps(puzzle, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Generated {args.count} puzzles to {out_dir}")


if __name__ == "__main__":
    main()
