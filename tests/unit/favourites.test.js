/**
 * Unit tests — lib/favorites.js
 * Run: npx jest favorites.test.js
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; },
    };
  })();
  
  Object.defineProperty(global, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
  
  global.window.dispatchEvent = jest.fn();
  
  // Re-import after mocks are set
  const { getFavorites, saveFavorites, toggleFavorite } = require("../../lib/favorites");
  
  const KEY = "rsu_housing_favorites";
  
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });
  
  // ── getFavorites ────────────────────────────────────────────
  describe("getFavorites", () => {
    it("returns empty array when nothing is stored", () => {
      expect(getFavorites()).toEqual([]);
    });
  
    it("returns parsed array from localStorage", () => {
      localStorage.setItem(KEY, JSON.stringify(["id1", "id2"]));
      expect(getFavorites()).toEqual(["id1", "id2"]);
    });
  
    it("returns empty array when localStorage has malformed JSON", () => {
      localStorage.setItem(KEY, "not-valid-json{{");
      expect(getFavorites()).toEqual([]);
    });
  });
  
  // ── saveFavorites ───────────────────────────────────────────
  describe("saveFavorites", () => {
    it("persists array to localStorage", () => {
      saveFavorites(["id1", "id2", "id3"]);
      const stored = JSON.parse(localStorage.getItem(KEY));
      expect(stored).toEqual(["id1", "id2", "id3"]);
    });
  
    it("dispatches favoritesUpdated event", () => {
      saveFavorites(["id1"]);
      expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    });
  
    it("handles empty array correctly", () => {
      saveFavorites([]);
      expect(JSON.parse(localStorage.getItem(KEY))).toEqual([]);
    });
  });
  
  // ── toggleFavorite ──────────────────────────────────────────
  describe("toggleFavorite", () => {
    it("adds a listing id when not already saved", () => {
      const result = toggleFavorite("listing-abc");
      expect(result).toContain("listing-abc");
    });
  
    it("removes a listing id when already saved", () => {
      saveFavorites(["listing-abc", "listing-xyz"]);
      const result = toggleFavorite("listing-abc");
      expect(result).not.toContain("listing-abc");
      expect(result).toContain("listing-xyz");
    });
  
    it("persists the toggle to localStorage", () => {
      toggleFavorite("listing-abc");
      expect(getFavorites()).toContain("listing-abc");
    });
  
    it("toggling twice returns to original empty state", () => {
      toggleFavorite("listing-abc");
      toggleFavorite("listing-abc");
      expect(getFavorites()).not.toContain("listing-abc");
    });
  
    it("handles multiple listings independently", () => {
      toggleFavorite("a");
      toggleFavorite("b");
      toggleFavorite("c");
      expect(getFavorites()).toEqual(["a", "b", "c"]);
    });
  });