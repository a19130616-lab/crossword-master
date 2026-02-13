#!/usr/bin/env python3
"""
Fetch high-frequency English words from Google's 10,000 word list
and merge them into raw_words.txt for enrichment.

Source: https://github.com/first20hours/google-10000-english (MIT license)
"""

import re
import requests
from pathlib import Path

URL = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt"

SCRIPT_DIR = Path(__file__).parent
RAW_WORDS_PATH = SCRIPT_DIR / "raw_words.txt"

# Words unsuitable for a crossword puzzle
EXCLUDED = {
    "sex", "god", "shit", "fuck", "cunt", "dick", "bitch", "nazi",
    "fag", "damn", "hell", "satan", "porn", "nude", "gay", "rape",
    "drug", "drugs", "viagra", "ebay", "yahoo", "google", "amazon",
    "xbox", "ipod", "wifi", "html", "http", "www", "url", "rss",
    "dvd", "usb", "pdf", "php", "xml", "css", "sql", "api",
    "jpg", "gif", "png", "mp3", "avi", "faq", "sms", "gps",
}


def fetch_frequency_list():
    print(f"Fetching word list from {URL}...")
    resp = requests.get(URL, timeout=30)
    resp.raise_for_status()
    words = resp.text.strip().splitlines()
    print(f"  Downloaded {len(words)} words")
    return words


def filter_words(words, min_len=3, max_len=8):
    """Filter to crossword-suitable words: letters only, proper length, common."""
    filtered = []
    seen = set()
    for w in words:
        w = w.strip().lower()
        if not w or w in seen:
            continue
        seen.add(w)
        if len(w) < min_len or len(w) > max_len:
            continue
        if not re.fullmatch(r"[a-z]+", w):
            continue
        if w in EXCLUDED:
            continue
        filtered.append(w.upper())
    return filtered


def main():
    # Fetch from remote
    remote_words = fetch_frequency_list()
    candidates = filter_words(remote_words)
    print(f"  After filtering: {len(candidates)} words (length 3-8, letters only)")

    # Load existing raw_words.txt
    existing = set()
    if RAW_WORDS_PATH.exists():
        existing = {
            line.strip().upper()
            for line in RAW_WORDS_PATH.read_text(encoding="utf-8").splitlines()
            if line.strip()
        }
        print(f"  Existing raw_words.txt: {len(existing)} words")

    # Find new words to add
    new_words = [w for w in candidates if w not in existing]
    print(f"  New words to add: {len(new_words)}")

    if not new_words:
        print("Nothing to add.")
        return

    # Show distribution
    from collections import Counter
    all_words = list(existing) + new_words
    lengths = Counter(len(w) for w in all_words)
    print("\n  Final distribution:")
    for l in sorted(lengths):
        marker = ""
        old_count = sum(1 for w in existing if len(w) == l)
        new_count = lengths[l] - old_count
        if new_count > 0:
            marker = f" (+{new_count})"
        print(f"    Length {l}: {lengths[l]}{marker}")
    print(f"    Total: {len(all_words)}")

    # Append new words to raw_words.txt
    with open(RAW_WORDS_PATH, "a", encoding="utf-8") as f:
        for w in new_words:
            f.write(f"{w}\n")

    print(f"\nAppended {len(new_words)} words to {RAW_WORDS_PATH}")
    print("Next step: run enricher.py to fetch definitions for the new words.")


if __name__ == "__main__":
    main()
