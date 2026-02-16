#!/usr/bin/env python3
"""
Score dictionary words by difficulty level using Chinese exam word lists.

Downloads exam word lists from KyleBing/english-vocabulary and cross-references
them against the current word_dictionary.json to assign difficulty levels and
exam tags to each word.

Usage:
    python3 score_words.py
"""

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DICT_PATH = ROOT / "backend" / "dictionary" / "word_dictionary.json"
OUTPUT_PATH = Path(__file__).parent / "word_levels.json"
CACHE_DIR = Path(__file__).parent / "exam_lists"

# Exam word list sources from KyleBing/english-vocabulary
BASE_URL = "https://raw.githubusercontent.com/KyleBing/english-vocabulary/master"
EXAM_SOURCES = {
    "junior_high": {
        "filename": "1 初中-乱序.txt",
        "label": "初中",
        "level_range": (1, 3),
    },
    "senior_high": {
        "filename": "2 高中-乱序.txt",
        "label": "高中/高考",
        "level_range": (4, 5),
    },
    "cet4": {
        "filename": "3 四级-乱序.txt",
        "label": "CET-4",
        "level_range": (5, 6),
    },
    "cet6": {
        "filename": "4 六级-乱序.txt",
        "label": "CET-6",
        "level_range": (6, 7),
    },
    "graduate": {
        "filename": "5 考研-乱序.txt",
        "label": "考研",
        "level_range": (7, 8),
    },
    "toefl": {
        "filename": "6 托福-乱序.txt",
        "label": "TOEFL",
        "level_range": (7, 8),
    },
    "sat": {
        "filename": "7 SAT-乱序.txt",
        "label": "SAT",
        "level_range": (9, 10),
    },
}

# Common suffixes to strip for fuzzy matching
SUFFIXES = [
    "TING", "SING", "NING", "RING", "LING", "MING", "PING", "KING",
    "ING", "TION", "SION", "MENT", "NESS", "ABLE", "IBLE",
    "ENCE", "ANCE", "LESS", "IOUS", "EOUS",
    "ICAL", "ALLY", "ULAR", "ATED",
    "FUL", "OUS", "IVE", "IAL", "ISH",
    "ED", "LY", "ER", "AL", "IC", "ES",
]

DEFAULT_LEVEL = 6


def download_exam_list(exam_key):
    """Download and cache a single exam word list. Returns the file path."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    source = EXAM_SOURCES[exam_key]
    cache_path = CACHE_DIR / f"{exam_key}.txt"

    if cache_path.exists():
        return cache_path

    url = f"{BASE_URL}/{urllib.request.quote(source['filename'])}"
    print(f"  Downloading {source['label']} from {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "crossword-master/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    cache_path.write_bytes(data)
    return cache_path


def parse_exam_txt(text):
    """Parse a KyleBing TXT file into a set of uppercase words.

    Format: word<tab>definition (one per line).
    Skips multi-word phrases (containing spaces).
    """
    words = set()
    for line in text.strip().split("\n"):
        if not line.strip():
            continue
        word = line.split("\t")[0].strip()
        if " " in word or not word:
            continue
        if not re.fullmatch(r"[a-zA-Z]+", word):
            continue
        words.add(word.upper())
    return words


def expand_forms(word):
    """Generate possible base forms by stripping common suffixes.

    Given a word like DISAPPOINTING, returns {DISAPPOINT, DISAPPOINTE, ...}
    that might match dictionary entries.
    """
    word = word.upper()
    forms = {word}
    for suffix in SUFFIXES:
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            base = word[:-len(suffix)]
            forms.add(base)
            forms.add(base + "E")
    # Handle doubled consonant before -ED/-ING (e.g., STOPPED -> STOP)
    if len(word) > 5:
        if word.endswith("ED") and word[-3] == word[-4]:
            forms.add(word[:-3])
        if word.endswith("ING") and len(word) > 6 and word[-4] == word[-5]:
            forms.add(word[:-4])
    return forms


def download_all_exam_lists():
    """Download all exam lists and return {exam_key: set_of_uppercase_words}."""
    print("Downloading exam word lists...")
    exam_words = {}
    for exam_key in EXAM_SOURCES:
        cache_path = download_exam_list(exam_key)
        text = cache_path.read_text(encoding="utf-8")
        raw_words = parse_exam_txt(text)

        # Expand each exam word to include base forms for better matching
        expanded = set()
        for w in raw_words:
            expanded.update(expand_forms(w))

        exam_words[exam_key] = expanded
        print(f"  {EXAM_SOURCES[exam_key]['label']}: {len(raw_words)} words ({len(expanded)} with forms)")
    return exam_words


def compute_level(word, exam_words):
    """Compute difficulty level and exam tags for a word.

    Returns (level, exam_list).
    - Level is the lowest level_range[0] among all matching exams.
    - If no match, returns (DEFAULT_LEVEL, []).
    """
    matched = []
    word_upper = word.upper()
    for exam_key, word_set in exam_words.items():
        if word_upper in word_set:
            matched.append(exam_key)

    if not matched:
        return DEFAULT_LEVEL, []

    min_level = min(EXAM_SOURCES[e]["level_range"][0] for e in matched)
    return min_level, sorted(matched)


def main():
    if not DICT_PATH.exists():
        raise FileNotFoundError(f"Dictionary not found: {DICT_PATH}")
    data = json.loads(DICT_PATH.read_text(encoding="utf-8"))
    dict_words = list(data.get("words", {}).keys())
    print(f"Loaded {len(dict_words)} dictionary words")

    exam_words = download_all_exam_lists()

    # Score each word
    levels = {}
    level_dist = {}
    matched_count = 0

    for word in dict_words:
        level, exams = compute_level(word, exam_words)
        levels[word] = {"level": level, "exams": exams}
        level_dist[level] = level_dist.get(level, 0) + 1
        if exams:
            matched_count += 1

    output = {
        "metadata": {
            "version": 1,
            "source": "KyleBing/english-vocabulary",
            "word_count": len(dict_words),
            "matched_count": matched_count,
            "match_rate": f"{100 * matched_count / len(dict_words):.1f}%",
            "level_distribution": {str(k): v for k, v in sorted(level_dist.items())},
        },
        "words": levels,
    }

    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nResults:")
    print(f"  Matched: {matched_count}/{len(dict_words)} ({100 * matched_count / len(dict_words):.1f}%)")
    print(f"  Unmatched (default level {DEFAULT_LEVEL}): {len(dict_words) - matched_count}")
    print(f"  Level distribution:")
    for level in sorted(level_dist):
        bar = "█" * (level_dist[level] // 20)
        print(f"    Level {level:2d}: {level_dist[level]:4d} {bar}")
    print(f"\nSaved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
