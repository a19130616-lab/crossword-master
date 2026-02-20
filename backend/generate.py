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

# Exam shortcut → cumulative level range
EXAM_LEVEL_RANGES = {
    "junior_high": (1, 3),
    "senior_high": (1, 5),
    "cet4":        (1, 6),
    "cet6":        (1, 7),
    "graduate":    (1, 8),
    "toefl":       (1, 8),
    "sat":         (1, 10),
}

# Human-readable labels for each exam (used in frontend)
EXAM_LABELS = {
    "junior_high": {"zh": "初中",  "en": "Junior High"},
    "senior_high": {"zh": "高中",  "en": "Senior High"},
    "cet4":        {"zh": "四级",  "en": "CET-4"},
    "cet6":        {"zh": "六级",  "en": "CET-6"},
    "graduate":    {"zh": "考研",  "en": "Graduate"},
    "toefl":       {"zh": "托福",  "en": "TOEFL"},
    "sat":         {"zh": "SAT",   "en": "SAT"},
}


def generate_tier(tier, tries, out_dir, manifest, puzzle_num, exam=None):
    """Generate puzzles for a single difficulty tier. Returns updated puzzle_num."""
    size = tier["size"]
    difficulty = tier["difficulty"]
    templates = get_templates(size)
    if not templates:
        print(f"Warning: No templates for size {size}, skipping {difficulty} tier")
        return puzzle_num

    used_global = None
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
        if exam:
            puzzle["exam"] = exam
        out_path = out_dir / f"{puzzle_id}.json"
        out_path.write_text(json.dumps(puzzle, ensure_ascii=False, indent=2), encoding="utf-8")
        entry = {
            "id": puzzle_id,
            "title": title,
            "difficulty": difficulty,
            "gridSize": size,
            "file": f"puzzles/{puzzle_id}.json"
        }
        if exam:
            entry["exam"] = exam
        manifest.append(entry)
        print(f"  [{difficulty}] {puzzle_id} ({size}x{size})")

    return puzzle_num


def generate_all_exams(out_dir, count_per_tier=None):
    """Generate puzzles for every exam level plus an 'all' set."""
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = []
    puzzle_num = 0

    tiers = DIFFICULTY_TIERS
    if count_per_tier is not None:
        tiers = [dict(t, count=count_per_tier) for t in tiers]

    # Generate a set for each exam level
    for exam_key, (min_lv, max_lv) in EXAM_LEVEL_RANGES.items():
        label = EXAM_LABELS.get(exam_key, {}).get("zh", exam_key)
        print(f"\n=== {label} ({exam_key}) level {min_lv}-{max_lv} ===")
        words = load_dictionary(min_level=min_lv, max_level=max_lv)
        print(f"  Dictionary: {len(words)} words")
        tries = build_tries(words)

        for tier in tiers:
            puzzle_num = generate_tier(tier, tries, out_dir, manifest, puzzle_num, exam=exam_key)

    index_path = out_dir / "index.json"
    index_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    # Write exam metadata for the frontend
    exam_meta = []
    for exam_key in EXAM_LEVEL_RANGES:
        labels = EXAM_LABELS.get(exam_key, {})
        exam_meta.append({
            "key": exam_key,
            "label": labels.get("zh", exam_key),
            "label_en": labels.get("en", exam_key),
        })
    meta_path = out_dir / "exams.json"
    meta_path.write_text(json.dumps(exam_meta, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nGenerated {puzzle_num} puzzles across {len(EXAM_LEVEL_RANGES)} exam levels to {out_dir}")


def main():
    parser = argparse.ArgumentParser(description="Generate crossword puzzles")
    parser.add_argument("--size", type=int, default=None, help="Grid size (omit for multi-size generation)")
    parser.add_argument("--count", type=int, default=None, help="Number of puzzles per size")
    parser.add_argument("--output", type=str, default=str(ROOT / "miniprogram" / "puzzles"), help="Output directory")
    parser.add_argument("--min-level", type=int, default=None, help="Minimum word difficulty level (1-10)")
    parser.add_argument("--max-level", type=int, default=None, help="Maximum word difficulty level (1-10)")
    parser.add_argument("--exam", type=str, default=None,
                        choices=list(EXAM_LEVEL_RANGES.keys()),
                        help="Target exam (maps to a level range)")
    parser.add_argument("--all-exams", action="store_true",
                        help="Generate puzzle sets for every exam level")
    parser.add_argument("--include-tags", type=str, nargs="*", default=None,
                        help="Include soft-excluded words with these tags")
    args = parser.parse_args()

    out_dir = Path(args.output)

    # --all-exams mode: generate for every exam level
    if args.all_exams:
        generate_all_exams(out_dir, count_per_tier=args.count)
        return

    out_dir.mkdir(parents=True, exist_ok=True)

    # Resolve level range from --exam shortcut or explicit --min/max-level
    min_level = args.min_level
    max_level = args.max_level
    if args.exam and args.exam in EXAM_LEVEL_RANGES:
        exam_min, exam_max = EXAM_LEVEL_RANGES[args.exam]
        if min_level is None:
            min_level = exam_min
        if max_level is None:
            max_level = exam_max

    include_tags = set(args.include_tags) if args.include_tags else None

    words = load_dictionary(min_level=min_level, max_level=max_level,
                            include_tags=include_tags)
    tries = build_tries(words)

    level_desc = f"level {min_level or 'any'}-{max_level or 'any'}"
    print(f"Dictionary: {len(words)} words ({level_desc})")

    # Build the list of tiers to generate
    if args.size is not None:
        # Single-size mode (backward compatible)
        count = args.count or 5
        tiers = [{"size": args.size, "difficulty": "custom", "count": count, "label": "Custom"}]
    else:
        tiers = DIFFICULTY_TIERS
        if args.count is not None:
            tiers = [dict(t, count=args.count) for t in tiers]

    manifest = []
    puzzle_num = 0

    for tier in tiers:
        puzzle_num = generate_tier(tier, tries, out_dir, manifest, puzzle_num, exam=args.exam)

    index_path = out_dir / "index.json"
    index_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nGenerated {puzzle_num} puzzles to {out_dir}")


if __name__ == "__main__":
    main()
