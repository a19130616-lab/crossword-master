#!/usr/bin/env python3
"""
Translate dictionary words from English to Chinese (word-level).
Builds a static JSON mapping { "APPLE": "苹果", ... } for use by build_dictionary.py.

Supports incremental processing — skips already-translated words.
Run in terminal to watch progress:
  python translate_words.py               # translate all remaining words
  python translate_words.py --batch 500   # translate up to 500 new words
"""

import argparse
import json
import time
from pathlib import Path
from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[2]
DICT_PATH = ROOT / "backend" / "dictionary" / "word_dictionary.json"
OUTPUT_PATH = Path(__file__).parent / "word_translations.json"


def load_words():
    """Load word list from the built dictionary."""
    if not DICT_PATH.exists():
        raise SystemExit(f"Dictionary not found: {DICT_PATH}\nRun build_dictionary.py first.")
    data = json.loads(DICT_PATH.read_text(encoding="utf-8"))
    return sorted(data.get("words", {}).keys())


def main():
    parser = argparse.ArgumentParser(description="Translate words EN→ZH")
    parser.add_argument("--batch", type=int, default=0,
                        help="Max words to process (0 = all)")
    args = parser.parse_args()

    all_words = load_words()
    print(f"Dictionary has {len(all_words)} words")

    # Load existing translations
    existing = {}
    if OUTPUT_PATH.exists():
        existing = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
        print(f"Loaded {len(existing)} existing translations")

    new_words = [w for w in all_words if w not in existing]
    print(f"Found {len(new_words)} words to translate")

    if args.batch > 0:
        new_words = new_words[:args.batch]
        print(f"Batch mode: processing {len(new_words)} words")

    if not new_words:
        print("Nothing to do.")
        return

    translator = GoogleTranslator(source='en', target='zh-CN')
    translated = 0
    failed = 0

    for i, word in enumerate(new_words, 1):
        try:
            result = translator.translate(word.lower())
            if result:
                existing[word] = result
                translated += 1
                print(f"  [{i}/{len(new_words)}] {word} → {result}")
            else:
                failed += 1
                print(f"  [{i}/{len(new_words)}] {word} → (empty)")
        except Exception as e:
            failed += 1
            print(f"  [{i}/{len(new_words)}] {word} → ERROR: {e}")

        # Checkpoint every 100 words
        if i % 100 == 0:
            OUTPUT_PATH.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  [checkpoint] saved {len(existing)} translations")

        time.sleep(0.3)

    # Final save
    OUTPUT_PATH.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDone: {translated} translated, {failed} failed")
    print(f"Total: {len(existing)} translations in {OUTPUT_PATH.name}")


if __name__ == "__main__":
    main()
