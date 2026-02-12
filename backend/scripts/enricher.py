#!/usr/bin/env python3
import requests
import json
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
            print(f"Error fetching definition for {word}: {e}")
            return None

    def enrich_words(self, word_list):
        enriched_bank = {}
        for word in word_list:
            word = word.upper()
            print(f"Enriching: {word}...", flush=True)
            definition = self.get_definition(word.lower())
            translation = None
            if definition:
                try:
                    translation = self.translator.translate(definition)
                except Exception as e:
                    print(f"Error translating definition for {word}: {e}")
            if definition and translation:
                enriched_bank[word] = {
                    "en": definition,
                    "zh": translation
                }
            time.sleep(1)
        return enriched_bank


def main():
    if not RAW_WORDS.exists():
        raise SystemExit(f"Missing {RAW_WORDS}")
    raw_words = [w.strip() for w in RAW_WORDS.read_text(encoding="utf-8").splitlines() if w.strip()]
    enricher = WordEnricher()
    results = enricher.enrich_words(raw_words)
    OUTPUT_JSON.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(results)} words to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
