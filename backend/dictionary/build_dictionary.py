#!/usr/bin/env python3
"""
Build word_dictionary.json for crossword generation.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORD_DB_PATH = ROOT / "scripts" / "lib" / "word_db.js"
WORDLIST_PATH = ROOT / "scripts" / "wordlist.txt"
OUTPUT_PATH = Path(__file__).parent / "word_dictionary.json"

EXCLUDED_WORDS = {
    "sex", "god", "shit", "fuck", "cunt", "dick", "bitch", "nazi", "fag", "damn", "hell", "satan"
}


def strip_js_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"//.*?$", "", text, flags=re.M)
    return text


def extract_js_block(src: str, name: str) -> str:
    # Use regex to find the start of the assignment
    m = re.search(rf"{name}\s*=\s*([\{{\[])", src)
    if not m:
        return None
    start = m.start(1)
    open_ch = src[start]
    close_ch = "}" if open_ch == "{" else "]"

    depth = 0
    for i in range(start, len(src)):
        ch = src[i]
        if ch == open_ch:
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0:
                return src[start:i + 1]
    return None


def js_to_json(js_text: str) -> str:
    js_text = strip_js_comments(js_text)
    js_text = re.sub(r",\s*([\]}])", r"\1", js_text)
    js_text = re.sub(r"'", '"', js_text)
    return js_text


def load_word_db():
    if not WORD_DB_PATH.exists():
        return {}, []

    raw = WORD_DB_PATH.read_text(encoding="utf-8")

    clue_block = extract_js_block(raw, "CLUE_BANK")
    freq_block = extract_js_block(raw, "TOP_FREQUENCY_WORDS")

    clue_bank = {}
    top_words = []

    if clue_block:
        try:
            clue_bank = json.loads(js_to_json(clue_block))
        except Exception:
            clue_bank = {}

    if freq_block:
        try:
            top_words = json.loads(js_to_json(freq_block))
        except Exception:
            top_words = []

    return clue_bank, top_words


def load_wordlist():
    if not WORDLIST_PATH.exists():
        return []
    return [w.strip().lower() for w in WORDLIST_PATH.read_text(encoding="utf-8").splitlines() if w.strip()]


def main():
    clue_bank, top_words = load_word_db()
    wordlist = load_wordlist()

    if not top_words:
        # Fallback: use wordlist order as frequency ranking
        top_words = wordlist[:]

    rank_map = {w: i + 1 for i, w in enumerate(top_words)}

    dictionary = {
        "metadata": {
            "word_count": 0
        },
        "words": {}
    }

    for w in wordlist:
        if not (3 <= len(w) <= 10):
            continue
        if not re.fullmatch(r"[a-z]+", w):
            continue
        if w in EXCLUDED_WORDS:
            continue

        rank = rank_map.get(w)
        if rank is None or rank > 3000:
            continue

        clue_text = clue_bank.get(w, "") if isinstance(clue_bank, dict) else ""

        dictionary["words"][w] = {
            "length": len(w),
            "rank": rank,
            "clues": {
                "easy": clue_text,
                "medium": clue_text,
                "hard": clue_text
            }
        }

    dictionary["metadata"]["word_count"] = len(dictionary["words"])

    OUTPUT_PATH.write_text(json.dumps(dictionary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {dictionary['metadata']['word_count']} words to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
