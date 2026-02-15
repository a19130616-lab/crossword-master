#!/usr/bin/env python3
"""
Build word_dictionary.json for crossword generation.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = Path(__file__).parent / "word_dictionary.json"
ENRICHED_PATH = ROOT / "backend" / "scripts" / "enriched_words.json"
TRANSLATIONS_PATH = ROOT / "backend" / "scripts" / "word_translations.json"
OVERRIDES_PATH = Path(__file__).parent / "translation_overrides.json"

# Words to exclude: profanity, proper nouns, place names, brands, abbreviations,
# non-words, sensitive content, and function words unsuitable for crosswords.
EXCLUDED_WORDS = {
    # Profanity / sensitive / inappropriate clues
    "sex", "god", "shit", "fuck", "cunt", "dick", "bitch", "nazi", "fag", "damn",
    "hell", "satan", "porn", "xxx", "nude", "abortion", "murder", "nuke",
    "rogers", "johns", "johnson", "jones", "pee", "les", "strange",
    # Proper nouns — names
    "ana", "anna", "bailey", "barry", "ben", "beth", "billy", "bob", "bobby",
    "brad", "burton", "cal", "carl", "carmen", "caroline", "charlie", "cole",
    "donna", "eva", "franklin", "graham", "harry", "henry", "holmes", "jake",
    "jenny", "jerry", "jill", "jimmy", "joe", "john", "johnny", "jonathan",
    "josh", "kay", "ken", "kent", "kirk", "kyle", "lee", "lewis", "logan",
    "louis", "madison", "marc", "maria", "martin", "mary", "mike", "monte",
    "murphy", "nancy", "nelson", "newton", "norman", "oscar", "perry", "peter",
    "ralph", "rick", "roger", "ron", "sally", "sam", "spencer", "stan", "ted",
    "terry", "timothy", "tom", "tommy", "tony", "troy", "victoria", "walker",
    "warren", "wright", "apache", "viking", "christ",
    # Place names / nationalities / country names
    "broadway", "chad", "holland", "mali", "reno", "roman", "savannah",
    "surrey", "vegas", "wales", "york", "brazil", "china", "dutch", "french",
    "german", "greek", "japan", "java", "mars", "mercury", "nato", "nyc",
    "safari", "shanghai", "spanish", "danish", "easter",
    # Brand names / tech products
    "acer", "cisco", "dell", "facebook", "ford", "intel", "kodak", "oracle",
    "skype", "unix", "yahoo", "chrome", "linux", "xerox", "zoom", "firewire",
    # Non-words / fragments / abbreviations / jargon / acronyms
    "aaa", "ala", "cas", "cdna", "cos", "das", "dee", "del", "des", "dis",
    "dom", "dos", "etc", "gsm", "ide", "lat", "lol", "mas", "ment", "mil",
    "mrna", "nat", "para", "pas", "str", "tex", "uri", "asp", "jpeg",
    "yrs", "inc", "corp", "exec", "std", "bbs", "thru", "ist", "howto",
    "aka", "ave", "dna", "rna", "faq", "diy", "gps", "pdf", "usb", "lcd",
    "atm", "ceo", "cfo", "cto", "coo", "ngo", "fifa", "wifi", "api",
    "bio", "biz", "kinda", "gonna", "gotta", "wanna",
    "ascii", "dpi", "fcc", "pcs", "plc", "ppm", "rpm", "div", "iso",
    "rom", "san", "eng", "est", "gen", "tri", "vid", "lib", "dod", "kai",
    "int", "sim", "leu", "ciao", "casa", "costa", "til",
    # More fragments / abbreviations / obscure terms
    "isp", "ent", "neo", "pct", "pre", "eco", "psi", "gel",
    # Tech / computing jargon
    "adware", "spyware", "freeware", "firmware", "ethernet", "intranet",
    "webcam", "webcast", "webpage", "wiki", "toolbar", "username", "modem",
    # Month abbreviations
    "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
    # Function words — poor crossword entries
    "the", "and", "that", "this", "with", "from", "have", "were", "been",
    "also", "than", "them", "then", "into", "very", "when", "each", "just",
    "only", "onto", "unto", "upon", "your", "what", "which", "their", "there",
    "about", "would", "shall", "could", "these", "those", "other", "after",
    "where", "every", "being", "does", "doing", "such", "here", "some",
    "most", "more", "much", "many", "well", "will", "whom", "whose",
    "any", "are", "both", "but", "can", "did", "few", "had", "has",
    "her", "him", "his", "how", "however", "its", "may", "might", "mine",
    "must", "nor", "not", "often", "ought", "ours", "out", "she", "should",
    "they", "too", "who", "why", "yes", "yet", "you", "yours",
}


def is_bad_clue(en_clue):
    """Reject clues that are garbled, circular, or too short to be useful."""
    if not en_clue or not en_clue.strip():
        return True
    clue = en_clue.strip()
    # Too short to be a real clue (under 15 chars)
    if len(clue) < 15:
        return True
    # Any occurrence of __ blanks from censoring (e.g., "genus __tus", "a __way")
    if "__" in clue:
        return True
    # Contains "(initialism)" or "(abbreviation)" — technical acronym definitions
    lower = clue.lower()
    if "(initialism)" in lower or "abbreviation of" in lower:
        return True
    return False


def main():
    # Load word-level translations (pre-built EN→ZH mapping)
    word_translations = {}
    if TRANSLATIONS_PATH.exists():
        word_translations = json.loads(TRANSLATIONS_PATH.read_text(encoding="utf-8"))
        print(f"Loaded {len(word_translations)} word translations")

    # Load manual translation overrides (fixes for bad auto-translations)
    overrides = {}
    if OVERRIDES_PATH.exists():
        overrides = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
        print(f"Loaded {len(overrides)} translation overrides")

    dictionary = {
        "metadata": {
            "word_count": 0,
            "source": "enriched_words.json"
        },
        "words": {}
    }

    bad_clue_count = 0

    enriched = json.loads(ENRICHED_PATH.read_text(encoding="utf-8"))
    for raw_word, clue_obj in (enriched or {}).items():
        w = raw_word.strip().lower()
        if not (3 <= len(w) <= 10):
            continue
        if not re.fullmatch(r"[a-z]+", w):
            continue
        if w in EXCLUDED_WORDS:
            continue

        en = (clue_obj or {}).get("en", "") if isinstance(clue_obj, dict) else ""
        zh = (clue_obj or {}).get("zh", "") if isinstance(clue_obj, dict) else ""
        key = w.upper()
        # Prefer: override > word translation > definition translation
        if key in overrides:
            zh = overrides[key]
        elif key in word_translations:
            zh = word_translations[key]
        if not en and not zh:
            continue
        if is_bad_clue(en):
            bad_clue_count += 1
            continue
        # Reject full-sentence Chinese translations (should be a concise word)
        if len(zh) > 15:
            bad_clue_count += 1
            continue

        dictionary["words"][key] = {
            "length": len(w),
            "clues": {
                "easy": {"en": en, "zh": zh},
                "medium": {"en": en, "zh": zh},
                "hard": {"en": en, "zh": zh}
            }
        }

    if bad_clue_count:
        print(f"Rejected {bad_clue_count} words with bad clues")

    # Deduplicate plurals: if both WORD and WORDS exist, keep only WORD
    all_keys = set(dictionary["words"].keys())
    plurals_removed = []
    for key in list(all_keys):
        if key.endswith("S") and key[:-1] in all_keys:
            del dictionary["words"][key]
            plurals_removed.append(key)
    if plurals_removed:
        print(f"Removed {len(plurals_removed)} plural duplicates")

    # Deduplicate inflected forms: if base form exists, remove the inflection
    # (e.g., remove ENDED if END exists, remove CODING if CODE exists)
    all_keys = set(dictionary["words"].keys())
    inflected_removed = []
    for key in sorted(all_keys):
        if key not in dictionary["words"]:
            continue
        # Check -ED, -ING, -ER, -LY, -EST suffixes
        bases = []
        if key.endswith("ED") and len(key) > 4:
            bases.append(key[:-2])       # WALKED → WALK
            bases.append(key[:-1])       # CLOSED → CLOS(E) — handled by +E below
            bases.append(key[:-2] + "E") # NAMED → NAME
            if len(key) > 5 and key[-3] == key[-4]:
                bases.append(key[:-3])   # STOPPED → STOP
        if key.endswith("ING") and len(key) > 5:
            bases.append(key[:-3])       # WALKING → WALK
            bases.append(key[:-3] + "E") # MAKING → MAKE
        if key.endswith("ER") and len(key) > 4:
            bases.append(key[:-2])       # BIGGER → BIG
            bases.append(key[:-1])       # CLOSER → CLOSE
        if key.endswith("EST") and len(key) > 5:
            bases.append(key[:-3])       # LOWEST → LOW
            bases.append(key[:-2])       # NICEST → NICE
        if key.endswith("LY") and len(key) > 4:
            bases.append(key[:-2])       # QUICKLY → QUICK
        for base in bases:
            if base in dictionary["words"] and base != key:
                del dictionary["words"][key]
                inflected_removed.append(key)
                break
    if inflected_removed:
        print(f"Removed {len(inflected_removed)} inflected duplicates")

    dictionary["metadata"]["word_count"] = len(dictionary["words"])

    OUTPUT_PATH.write_text(json.dumps(dictionary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {dictionary['metadata']['word_count']} words to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
