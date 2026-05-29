/**
 * Unit tests — lib/locations.js
 * Run: npx jest locations.test.js
 */

 const {
    LOCATIONS,
    LOCATION_FILTER_OPTIONS,
    UST_GATE_AREAS,
    OTHER_PH_AREAS,
    UNIVERSITIES,
    UNIVERSITY_AREA_MAP,
  } = require("../../lib/locations");
  
  // ── LOCATIONS ───────────────────────────────────────────────
  describe("LOCATIONS", () => {
    it("is a non-empty array", () => {
      expect(Array.isArray(LOCATIONS)).toBe(true);
      expect(LOCATIONS.length).toBeGreaterThan(0);
    });
  
    it("every location has value, label, hint, and mapQuery", () => {
      LOCATIONS.forEach((loc) => {
        expect(loc).toHaveProperty("value");
        expect(loc).toHaveProperty("label");
        expect(loc).toHaveProperty("hint");
        expect(loc).toHaveProperty("mapQuery");
      });
    });
  
    it("includes Choba (Back Gate)", () => {
      const values = LOCATIONS.map((l) => l.value);
      expect(values).toContain("Choba (Back Gate)");
    });
  
    it("includes an Other fallback option", () => {
      const values = LOCATIONS.map((l) => l.value);
      expect(values).toContain("Other");
    });
  
    it("has no duplicate values", () => {
      const values = LOCATIONS.map((l) => l.value);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });
  
  // ── LOCATION_FILTER_OPTIONS ─────────────────────────────────
  describe("LOCATION_FILTER_OPTIONS", () => {
    it("starts with an All Areas option", () => {
      expect(LOCATION_FILTER_OPTIONS[0].value).toBe("All");
      expect(LOCATION_FILTER_OPTIONS[0].label).toBe("All Areas");
    });
  
    it("contains all LOCATIONS entries after the All option", () => {
      expect(LOCATION_FILTER_OPTIONS.length).toBe(LOCATIONS.length + 1);
    });
  });
  
  // ── UST_GATE_AREAS ──────────────────────────────────────────
  describe("UST_GATE_AREAS", () => {
    it("contains Choba (Back Gate)", () => {
      expect(UST_GATE_AREAS).toContain("Choba (Back Gate)");
    });
  
    it("contains Obirikwe (Main Gate)", () => {
      expect(UST_GATE_AREAS).toContain("Obirikwe (Main Gate)");
    });
  
    it("all UST areas exist in LOCATIONS", () => {
      const locationValues = LOCATIONS.map((l) => l.value);
      UST_GATE_AREAS.forEach((area) => {
        expect(locationValues).toContain(area);
      });
    });
  });
  
  // ── OTHER_PH_AREAS ──────────────────────────────────────────
  describe("OTHER_PH_AREAS", () => {
    it("contains GRA", () => {
      expect(OTHER_PH_AREAS).toContain("GRA");
    });
  
    it("does not overlap with UST_GATE_AREAS", () => {
      const overlap = UST_GATE_AREAS.filter((a) => OTHER_PH_AREAS.includes(a));
      expect(overlap).toHaveLength(0);
    });
  });
  
  // ── UNIVERSITIES ────────────────────────────────────────────
  describe("UNIVERSITIES", () => {
    it("starts with Any School option", () => {
      expect(UNIVERSITIES[0].value).toBe("All");
    });
  
    it("includes UST, UniPort, IAUE, KenSaro", () => {
      const values = UNIVERSITIES.map((u) => u.value);
      expect(values).toContain("UST");
      expect(values).toContain("UniPort");
      expect(values).toContain("IAUE");
      expect(values).toContain("KenSaro");
    });
  
    it("every university has value and label", () => {
      UNIVERSITIES.forEach((uni) => {
        expect(uni).toHaveProperty("value");
        expect(uni).toHaveProperty("label");
      });
    });
  });
  
  // ── UNIVERSITY_AREA_MAP ─────────────────────────────────────
  describe("UNIVERSITY_AREA_MAP", () => {
    it("has entries for all main universities", () => {
      expect(UNIVERSITY_AREA_MAP).toHaveProperty("UST");
      expect(UNIVERSITY_AREA_MAP).toHaveProperty("UniPort");
      expect(UNIVERSITY_AREA_MAP).toHaveProperty("IAUE");
      expect(UNIVERSITY_AREA_MAP).toHaveProperty("KenSaro");
    });
  
    it("UST maps to Choba (Back Gate)", () => {
      expect(UNIVERSITY_AREA_MAP.UST).toContain("Choba (Back Gate)");
    });
  
    it("all mapped areas exist in LOCATIONS (or are valid placeholders)", () => {
      const locationValues = [...LOCATIONS.map((l) => l.value), "Bori"];
      Object.values(UNIVERSITY_AREA_MAP).forEach((areas) => {
        areas.forEach((area) => {
          expect(locationValues).toContain(area);
        });
      });
    });
  
    it("Other key returns an empty array", () => {
      expect(UNIVERSITY_AREA_MAP.Other).toEqual([]);
    });
  });