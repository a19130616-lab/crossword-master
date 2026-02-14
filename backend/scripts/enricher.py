#!/usr/bin/env python3
"""
Enrich raw words with English definitions and Chinese translations.
Supports incremental processing and batch limits.

Usage:
  python enricher.py                  # enrich all new words
  python enricher.py --batch 500      # enrich up to 500 new words, then save
"""

import argparse
import requests
import json
import re
import time
from pathlib import Path
from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[2]
RAW_WORDS = Path(__file__).parent / "raw_words.txt"
OUTPUT_JSON = Path(__file__).parent / "enriched_words.json"


class WordEnricher:
    def __init__(self):
        self.dict_api = "https://api.dictionaryapi.dev/api/v2/entries/en/"
        self.translator = GoogleTranslator(source='en', target='zh-CN')

    def get_definition(self, word):
        try:
            response = requests.get(f"{self.dict_api}{word}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                definition = data[0]['meanings'][0]['definitions'][0]['definition']
                return definition
            return None
        except Exception as e:
            print(f"  Error fetching definition for {word}: {e}")
            return None

    def enrich_words(self, word_list, save_fn=None, save_every=50):
        """Enrich words. Optionally call save_fn every `save_every` words."""
        enriched_bank = {}
        for i, word in enumerate(word_list, 1):
            word = word.upper()
            print(f"  [{i}/{len(word_list)}] {word}...", flush=True)
            definition = self.get_definition(word.lower())
            translation = None
            if definition:
                try:
                    translation = self.translator.translate(definition)
                except Exception as e:
                    print(f"  Error translating {word}: {e}")
            if definition and translation:
                censored_en = self.censor_word(definition, word)
                censored_zh = self.censor_word(translation, word)
                enriched_bank[word] = {
                    "en": censored_en,
                    "zh": censored_zh
                }
            time.sleep(0.5)
            # Periodic save to avoid data loss
            if save_fn and i % save_every == 0:
                save_fn(enriched_bank)
                print(f"  [checkpoint] saved after {i} words", flush=True)
        return enriched_bank

    def censor_word(self, text, word):
        if not text:
            return text
        pattern = re.compile(re.escape(word), re.IGNORECASE)
        return pattern.sub("__", text)


def main():
    parser = argparse.ArgumentParser(description="Enrich words with definitions")
    parser.add_argument("--batch", type=int, default=0,
                        help="Max words to process (0 = all)")
    args = parser.parse_args()

    if not RAW_WORDS.exists():
        raise SystemExit(f"Missing {RAW_WORDS}")

    raw_words = [w.strip().upper() for w in RAW_WORDS.read_text(encoding="utf-8").splitlines() if w.strip()]
    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for w in raw_words:
        if w not in seen:
            seen.add(w)
            deduped.append(w)
    raw_words = deduped

    # Load existing enriched data
    existing = {}
    if OUTPUT_JSON.exists():
        existing = json.loads(OUTPUT_JSON.read_text(encoding="utf-8"))
        print(f"Loaded {len(existing)} existing enriched words")

    new_words = [w for w in raw_words if w not in existing]
    print(f"Found {len(new_words)} new words to enrich")

    if args.batch > 0:
        new_words = new_words[:args.batch]
        print(f"Batch mode: processing {len(new_words)} words")

    if not new_words:
        print("Nothing to do.")
        return

    def save_checkpoint(partial):
        existing.update(partial)
        OUTPUT_JSON.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")

    enricher = WordEnricher()
    results = enricher.enrich_words(new_words, save_fn=save_checkpoint, save_every=50)
    existing.update(results)
    print(f"Enriched {len(results)} new words")

    OUTPUT_JSON.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(existing)} total words to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
