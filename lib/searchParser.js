// lib/searchParser.js

export const TYPE_OPTIONS = [
    "Self Contain",
    "Single Room",
    "Mini Flat",
    "1 Bedroom Flat",
    "2 Bedroom Flat",
    "3 Bedroom Flat",
    "Shared Room",
    "Studio Apartment",
  ];
  
  // Canonical type <- every realistic way a PH student types it
  const TYPE_ALIASES = {
    "self con": "Self Contain",
    "self-con": "Self Contain",
    "selfcon": "Self Contain",
    "self contain": "Self Contain",
    "self-contain": "Self Contain",
    "self contained": "Self Contain",
    "self-contained": "Self Contain",
    "sc": "Self Contain",
  
    "single room": "Single Room",
    "single": "Single Room",
    "one room": "Single Room",
  
    "mini flat": "Mini Flat",
    "miniflat": "Mini Flat",
    "mini": "Mini Flat",
  
    "studio": "Studio Apartment",
    "studio apartment": "Studio Apartment",
    "studio apt": "Studio Apartment",
  
    "shared room": "Shared Room",
    "shared": "Shared Room",
    "roommate": "Shared Room",
    "share": "Shared Room",
  
    "1 bedroom flat": "1 Bedroom Flat",
    "1 bedroom": "1 Bedroom Flat",
    "1bedroom": "1 Bedroom Flat",
    "one bedroom flat": "1 Bedroom Flat",
    "one bedroom": "1 Bedroom Flat",
    "1bdrm": "1 Bedroom Flat",
  
    "2 bedroom flat": "2 Bedroom Flat",
    "2 bedroom": "2 Bedroom Flat",
    "2bedroom": "2 Bedroom Flat",
    "two bedroom flat": "2 Bedroom Flat",
    "two bedroom": "2 Bedroom Flat",
    "2bdrm": "2 Bedroom Flat",
  
    "3 bedroom flat": "3 Bedroom Flat",
    "3 bedroom": "3 Bedroom Flat",
    "3bedroom": "3 Bedroom Flat",
    "three bedroom flat": "3 Bedroom Flat",
    "three bedroom": "3 Bedroom Flat",
    "3bdrm": "3 Bedroom Flat",
  };
  
  // beds -> integer
  const BED_ALIASES = {
    "one bed": 1, "1 bed": 1, "1bed": 1, "single bed": 1,
    "two bed": 2, "2 bed": 2, "2bed": 2,
    "three bed": 3, "3 bed": 3, "3bed": 3,
    "four bed": 4, "4 bed": 4, "4bed": 4,
  };
  
  function normalize(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  // longest keys first so "2 bedroom flat" wins over "2 bedroom"
  function sortedKeys(map) {
    return Object.keys(map).sort((a, b) => b.length - a.length);
  }
  
  const TYPE_KEYS = sortedKeys(TYPE_ALIASES);
  const BED_KEYS = sortedKeys(BED_ALIASES);
  
  /**
   * Parses free text like "self con one bed near ust" into structured filters.
   * Returns { type, beds, text } — text is whatever wasn't matched,
   * meant for a loose match against title/location.
   */
  export function parseSearchQuery(raw) {
    const q = normalize(raw || "");
    if (!q) return { type: null, beds: null, text: "" };
  
    let remaining = ` ${q} `;
    let type = null;
    let beds = null;
  
    for (const key of TYPE_KEYS) {
      if (remaining.includes(` ${key} `)) {
        type = TYPE_ALIASES[key];
        remaining = remaining.replace(` ${key} `, " ");
        break;
      }
    }
  
    for (const key of BED_KEYS) {
      if (remaining.includes(` ${key} `)) {
        beds = BED_ALIASES[key];
        remaining = remaining.replace(` ${key} `, " ");
        break;
      }
    }
  
    // catches "1 bedroom", "2 beds" etc if not caught above
    if (beds === null) {
      const m = remaining.match(/\b([1-4])\s*(bed|beds|bedroom|bedrooms)\b/);
      if (m) beds = Number(m[1]);
    }
  
    return { type, beds, text: remaining.replace(/\s+/g, " ").trim() };
  }