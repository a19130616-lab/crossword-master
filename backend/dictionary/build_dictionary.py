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
LEVELS_PATH = ROOT / "backend" / "scripts" / "word_levels.json"

# Hard exclusions: never include in any dictionary output.
HARD_EXCLUDED = {
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
    # Place names that are purely proper nouns
    "broadway", "chad", "holland", "mali", "reno", "savannah",
    "surrey", "vegas", "wales", "york", "brazil", "china",
    "japan", "java", "mars", "mercury", "nato", "nyc",
    "safari", "shanghai", "easter",
    # Brand names / tech products
    "acer", "cisco", "dell", "facebook", "ford", "intel", "kodak", "oracle",
    "skype", "unix", "yahoo", "chrome", "linux", "xerox", "zoom", "firewire",
    # Non-words / fragments / abbreviations / jargon / acronyms
    "aaa", "ala", "cas", "cdna", "cos", "das", "dee", "del", "des", "dis",
    "dom", "dos", "etc", "gsm", "ide", "lat", "lol", "mas", "ment", "mil",
    "mrna", "nat", "para", "pas", "str", "tex", "uri", "asp", "jpeg",
    "yrs", "inc", "corp", "exec", "std", "bbs", "thru", "ist", "howto",
    "aka", "ave", "faq", "diy", "lcd",
    "ceo", "cfo", "cto", "coo", "ngo", "fifa",
    "bio", "biz", "kinda", "gonna", "gotta", "wanna",
    "ascii", "dpi", "fcc", "pcs", "plc", "ppm", "rpm", "div", "iso",
    "rom", "san", "eng", "est", "gen", "tri", "vid", "lib", "dod", "kai",
    "int", "sim", "leu", "ciao", "casa", "costa", "til", "ids",
    # More fragments / abbreviations / obscure terms
    "isp", "ent", "neo", "pct", "pre", "eco", "psi", "gel",
    "fwd", "lbs", "msg", "pst", "rrp", "tvs", "thy", "sat",
    "mambo", "sizes",
    # Month abbreviations
    "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
    # Function words — poor crossword entries
    "the", "and", "that", "this", "with", "from", "have", "were", "been",
    "also", "than", "them", "then", "into", "very", "when", "each", "just",
    "only", "onto", "unto", "upon", "your", "what", "which", "their", "there",
    "about", "would", "could", "these", "those", "other", "after",
    "where", "every", "being", "does", "doing", "such", "here", "some",
    "most", "more", "much", "many", "well", "will", "whose",
    "any", "are", "both", "but", "can", "did", "few", "had", "has",
    "her", "him", "his", "how", "however", "its", "may", "might", "mine",
    "must", "nor", "not", "often", "ours", "out", "she", "should",
    "they", "too", "who", "why", "yes", "yet", "you", "yours",
}

# Soft exclusions: tagged words excluded from the default pool,
# but available when generating puzzles with specific tag filters.
SOFT_EXCLUDED = {
    # Nationality / place-derived adjectives — real vocabulary
    "dutch":    {"tags": ["nationality"]},
    "french":   {"tags": ["nationality"]},
    "german":   {"tags": ["nationality"]},
    "greek":    {"tags": ["nationality"]},
    "spanish":  {"tags": ["nationality"]},
    "danish":   {"tags": ["nationality"]},
    "roman":    {"tags": ["nationality"]},
    # Common abbreviations that appear on exams
    "dna":      {"tags": ["abbreviation", "science"]},
    "rna":      {"tags": ["abbreviation", "science"]},
    "gps":      {"tags": ["abbreviation", "technology"]},
    "wifi":     {"tags": ["abbreviation", "technology"]},
    "pdf":      {"tags": ["abbreviation", "technology"]},
    "usb":      {"tags": ["abbreviation", "technology"]},
    "api":      {"tags": ["abbreviation", "technology"]},
    "atm":      {"tags": ["abbreviation"]},
    # Tech jargon — useful for computing-themed puzzles
    "adware":   {"tags": ["technology"]},
    "spyware":  {"tags": ["technology"]},
    "freeware": {"tags": ["technology"]},
    "firmware": {"tags": ["technology"]},
    "ethernet": {"tags": ["technology"]},
    "intranet": {"tags": ["technology"]},
    "webcam":   {"tags": ["technology"]},
    "webcast":  {"tags": ["technology"]},
    "webpage":  {"tags": ["technology"]},
    "wiki":     {"tags": ["technology"]},
    "toolbar":  {"tags": ["technology"]},
    "username": {"tags": ["technology"]},
    "modem":    {"tags": ["technology"]},
    # Formal function words that appear in exams
    "whom":     {"tags": ["formal"]},
    "ought":    {"tags": ["formal"]},
    "shall":    {"tags": ["formal"]},
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


def is_bad_zh_clue(zh_clue):
    """Reject Chinese translations that are sentence-like or too vague."""
    if not zh_clue or not zh_clue.strip():
        return True
    clue = zh_clue.strip()
    # Ends with Chinese period — likely a sentence, not a concise clue
    if clue.endswith("。"):
        return True
    # Contains Chinese semicolon or comma-separated phrases — too verbose
    if "；" in clue or "，" in clue:
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

    # Load word levels (from score_words.py output)
    levels_data = {}
    if LEVELS_PATH.exists():
        levels_json = json.loads(LEVELS_PATH.read_text(encoding="utf-8"))
        levels_data = levels_json.get("words", {})
        print(f"Loaded {len(levels_data)} word levels")

    dictionary = {
        "metadata": {
            "word_count": 0,
            "source": "enriched_words.json"
        },
        "words": {}
    }

    bad_clue_count = 0
    soft_excluded_count = 0

    enriched = json.loads(ENRICHED_PATH.read_text(encoding="utf-8"))
    for raw_word, clue_obj in (enriched or {}).items():
        w = raw_word.strip().lower()
        if not (3 <= len(w) <= 10):
            continue
        if not re.fullmatch(r"[a-z]+", w):
            continue
        if w in HARD_EXCLUDED:
            continue

        # Check if this is a soft-excluded word
        soft_info = SOFT_EXCLUDED.get(w)

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
        # Reject sentence-like Chinese clues (e.g. ending with "。")
        if is_bad_zh_clue(zh):
            bad_clue_count += 1
            continue

        entry = {
            "length": len(w),
            "clues": {
                "easy": {"en": en, "zh": zh},
                "medium": {"en": en, "zh": zh},
                "hard": {"en": en, "zh": zh}
            }
        }

        # Merge level data from word_levels.json
        level_info = levels_data.get(key, {})
        if level_info:
            entry["level"] = level_info.get("level", 6)
            entry["exams"] = level_info.get("exams", [])

        # Tag soft-excluded words
        if soft_info:
            entry["tags"] = soft_info["tags"]
            entry["excludeDefault"] = True
            soft_excluded_count += 1

        dictionary["words"][key] = entry

    if bad_clue_count:
        print(f"Rejected {bad_clue_count} words with bad clues")
    if soft_excluded_count:
        print(f"Tagged {soft_excluded_count} soft-excluded words")

    # Build a set of all known English words from source data (including words
    # that were filtered out due to length, exclusion, or bad clues). This lets
    # us detect plurals even when the base form isn't in the final dictionary.
    all_known_words = set()
    for raw_word in (enriched or {}):
        w = raw_word.strip().upper()
        if re.fullmatch(r"[A-Z]+", w):
            all_known_words.add(w)

    # Standalone words that happen to look like inflections — never remove these.
    INFLECTION_SAFELIST = {
        # -ING words that are standalone nouns/adjectives
        "AMAZING", "BINDING", "BLESSING", "BORING", "BUILDING", "CEILING",
        "CLOTHING", "COATING", "COMING", "CUNNING", "CUTTING", "DARLING",
        "DRAWING", "DWELLING", "EARNING", "EVENING", "EXCITING", "FEELING",
        "FILLING", "FINDING", "FITTING", "BLESSING", "GAMBLING", "GREETING",
        "GROUNDING", "HEADING", "HEARING", "HIDING", "HIKING", "HOLDING",
        "HOUSING", "HUNTING", "KILLING", "KNITTING", "LANDING", "LASTING",
        "LEADING", "LEARNING", "LENDING", "LIGHTNING", "LISTING", "LIVING",
        "LOADING", "LODGING", "LONGING", "MEANING", "MEETING", "MINING",
        "MISSING", "MORNING", "NURSING", "OFFERING", "OPENING", "OPENING",
        "OUTING", "PAINTING", "PARKING", "PENDING", "PLANNING", "PLUMBING",
        "PRESSING", "PRICING", "PRINTING", "PUDDING", "RANKING", "RATING",
        "READING", "RECORDING", "RING", "ROOFING", "RULING", "RUNNING",
        "SAVING", "SAYING", "SETTING", "SHIPPING", "SHOOTING", "SHOPPING",
        "SING", "SITTING", "SKATING", "SKIING", "SMOKING", "SOMETHING",
        "SPELLING", "SPENDING", "SPORTING", "SPRING", "STAFFING",
        "STANDING", "STERLING", "STING", "STOCKING", "STRING", "STUNNING",
        "SUFFERING", "SURFING", "SURROUNDING", "SWING", "TEACHING",
        "THING", "TIMING", "TRADING", "TRAINING", "TRAVELING", "TUNING",
        "TURNING", "UNDERLYING", "WARNING", "WASHING", "WEDDING",
        "WILLING", "WINDING", "WING", "WINNING", "WIRING", "WORKING",
        "WRESTLING", "WRITING",
        # -ED words that are standalone adjectives/nouns
        "ADVANCED", "AGED", "ALLEGED", "ALLIED", "ANIMATED", "ARMED",
        "ASSUMED", "ASSURED", "ATTACHED", "BELOVED", "BIASED", "BLESSED",
        "BREED", "BURIED", "CLOSED", "COLORED", "COMBINED", "COMPLICATED",
        "CONCERNED", "CONFUSED", "CONNECTED", "CONVINCED", "CROOKED",
        "CROWDED", "CURVED", "DATED", "DEDICATED", "DETAILED", "DETERMINED",
        "DISABLED", "DISAPPOINTED", "EDUCATED", "ELEVATED", "EMBEDDED",
        "EMPLOYED", "ENCLOSED", "ENRICHED", "ENTITLED", "EVOLVED",
        "EXCITED", "EXPERIENCED", "EXPOSED", "EXTENDED", "FIXED", "HUNDRED",
        "INDEED", "INFORMED", "INSPIRED", "INTERESTED", "ISOLATED",
        "LIMITED", "LINKED", "LOCATED", "LOVED", "NAKED", "ORGANIZED",
        "PLEASED", "POINTED", "PRONOUNCED", "PROPOSED", "QUALIFIED",
        "REDUCED", "REFINED", "RELATED", "RELAXED", "RETIRED", "SACRED",
        "SATISFIED", "SCARED", "SCATTERED", "SEED", "SELECTED", "SHED",
        "SKILLED", "SLED", "SPEED", "SPIRITED", "SUPPOSED", "SURPRISED",
        "TALENTED", "TIRED", "TROUBLED", "TWISTED", "UNITED",
        "UNUSED", "VARIED", "WEED", "WICKED", "WORRIED", "WOUNDED",
        # -ER words that are standalone nouns
        "BANNER", "BLENDER", "BOULDER", "BUFFER", "BUTTER", "CHAPTER",
        "CHARACTER", "CLUSTER", "COMPUTER", "CONSIDER", "CONSUMER",
        "CONTAINER", "COUNTER", "COVER", "CRACKER", "CYLINDER",
        "DISCOVER", "DISORDER", "ENCOUNTER", "ENTER", "FEVER", "FINGER",
        "FLOWER", "FOLDER", "GENDER", "GINGER", "HAMMER", "HUNGER",
        "LADDER", "LASER", "LAUGHTER", "LAYER", "LEATHER", "LETTER",
        "LEVER", "LITTER", "LIVER", "LUMBER", "MANNER", "MASTER",
        "MATTER", "MEMBER", "MERGER", "METER", "MONSTER", "MURDER",
        "NUMBER", "OFFER", "ORDER", "OTHER", "OVER", "OYSTER", "PAPER",
        "PEPPER", "PLASTER", "PLUNDER", "POWDER", "POWER", "PREMIER",
        "PRIMER", "PROPER", "QUARTER", "RATHER", "RECOVER", "RUBBER",
        "SEMESTER", "SHELTER", "SHOULDER", "SILVER", "SMOTHER", "SOCCER",
        "SOLDER", "SPIDER", "STAGGER", "SUMMER", "SUPER", "TIMBER",
        "TIMBER", "TOGETHER", "TOWER", "TRANSFER", "TRIGGER", "UNDER",
        "UPPER", "UTTER", "WANDER", "WATER", "WEATHER", "WHISPER",
        "WINTER", "WONDER",
        # -LY words that are standalone adjectives
        "BELLY", "BULLY", "CURLY", "DAILY", "DEADLY", "EARLY", "ELDERLY",
        "FAIRLY", "FAMILY", "FINALLY", "FLY", "FRIENDLY", "GHASTLY",
        "GLOOMY", "GODLY", "GOODLY", "HARDLY", "HEAVENLY", "HOLLY",
        "HOMELY", "JELLY", "JOLLY", "LILY", "LIKELY", "LIVELY", "LONELY",
        "LOVELY", "MANLY", "MERELY", "MONTHLY", "NAMELY", "NEARLY",
        "NEWLY", "NIGHTLY", "NOBLY", "ONLY", "ORDERLY", "PARTLY",
        "POORLY", "RALLY", "RARELY", "SILLY", "SOLELY", "SUPPLY",
        "SURELY", "TALLY", "UGLY", "UNLIKELY", "WEEKLY", "WHOLLY",
        "WORLDLY",
    }

    # Deduplicate plurals: remove WORDS if WORD is a known English word
    # (either in our dictionary or in the broader source data)
    all_keys = set(dictionary["words"].keys())
    plurals_removed = []
    for key in list(all_keys):
        if key.endswith("S") and len(key) >= 4 and key not in INFLECTION_SAFELIST:
            base = key[:-1]
            if base in all_keys or base in all_known_words:
                del dictionary["words"][key]
                all_keys.discard(key)
                plurals_removed.append(key)
    if plurals_removed:
        print(f"Removed {len(plurals_removed)} plural duplicates")

    # Deduplicate inflected forms: remove inflection if base exists in dictionary
    # OR in the broader source data. The INFLECTION_SAFELIST protects standalone
    # words that happen to look like inflections (e.g., EVENING, BUILDING).
    inflected_removed = []
    for key in sorted(list(all_keys)):
        if key not in dictionary["words"]:
            continue
        if key in INFLECTION_SAFELIST:
            continue
        # Check -ED, -ING, -ER, -LY, -EST suffixes
        bases = []
        if key.endswith("ED") and len(key) > 4:
            bases.append(key[:-2])       # WALKED → WALK
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
            if base != key and (base in all_keys or base in all_known_words):
                del dictionary["words"][key]
                all_keys.discard(key)
                inflected_removed.append(key)
                break
    if inflected_removed:
        print(f"Removed {len(inflected_removed)} inflected duplicates")

    # Compute level distribution for metadata
    level_dist = {}
    for entry in dictionary["words"].values():
        lvl = entry.get("level")
        if lvl is not None:
            level_dist[lvl] = level_dist.get(lvl, 0) + 1

    dictionary["metadata"]["word_count"] = len(dictionary["words"])
    if levels_data:
        dictionary["metadata"]["levels_source"] = "word_levels.json"
        dictionary["metadata"]["level_distribution"] = {
            str(k): v for k, v in sorted(level_dist.items())
        }

    OUTPUT_PATH.write_text(json.dumps(dictionary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {dictionary['metadata']['word_count']} words to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
