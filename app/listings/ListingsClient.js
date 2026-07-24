"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ListingCard from "@/components/listings/ListingCard";
import { fetchListings } from "@/lib/firestoreListings";
import { LOCATION_FILTER_OPTIONS, UNIVERSITY_AREA_MAP } from "@/lib/locations";
import { parseSearchQuery, TYPE_OPTIONS as PARSER_TYPE_OPTIONS } from "@/lib/searchParser";
import "@/styles/listings-page.css";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "most_viewed", label: "Most viewed" },
];

const TYPE_OPTIONS = ["All", ...PARSER_TYPE_OPTIONS];
const BED_OPTIONS = ["All", "1", "2", "3", "4"];
const FURNISH_OPTIONS = ["All", "Furnished", "Unfurnished", "Semi-furnished"];
const AVAIL_OPTIONS = ["All", "Available Now", "Available Soon", "Not Available"];
const UNI_OPTIONS = ["All", "RSU", "UniPort", "IAUE", "KSU"];

const PRICE_PRESETS = [
  { label: "Under ₦200k", min: "", max: "200000" },
  { label: "₦200k–₦400k", min: "200000", max: "400000" },
  { label: "₦400k–₦700k", min: "400000", max: "700000" },
  { label: "₦700k+", min: "700000", max: "" },
];

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

function AccordionSection({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="lp__filter-section">
      <button
        className={`lp__filter-section-toggle${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <span className="lp__filter-section-toggle-left">
          <span className="lp__filter-section-icon">{icon}</span>
          {title}
        </span>
        <svg
          className={`lp__chevron${open ? " open" : ""}`}
          width="14" height="14" viewBox="0 0 14 14" fill="none"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="lp__filter-section-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChipGroup({ options, value, onChange, multi = false }) {
  function handleClick(opt) {
    if (multi) {
      onChange(value === opt ? "All" : opt);
    } else {
      onChange(value === opt ? "All" : opt);
    }
  }
  return (
    <div className="lp__chip-group">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`lp__chip${value === opt ? " active" : ""}`}
          onClick={() => handleClick(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ActivePills({ pills, onRemove, onClearAll }) {
  if (pills.length === 0) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="lp__pills"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
      >
        <span className="lp__pills-label">Active filters:</span>
        {pills.map((pill) => (
          <motion.button
            key={pill.key}
            className="lp__pill"
            type="button"
            onClick={() => onRemove(pill.key)}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.13 }}
          >
            {pill.label}
            <span className="lp__pill-x" aria-hidden="true">✕</span>
          </motion.button>
        ))}
        {pills.length > 1 && (
          <button type="button" className="lp__pill lp__pill--clear" onClick={onClearAll}>
            Clear all
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Skeleton() {
  return (
    <div className="lp__grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="lp__skeleton-card">
          <div className="lp__skeleton-img" />
          <div className="lp__skeleton-body">
            <div className="lp__skeleton-line lp__skeleton-line--short" />
            <div className="lp__skeleton-line" />
            <div className="lp__skeleton-line lp__skeleton-line--med" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileFilterDrawer({ open, onClose, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="lp__drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="lp__drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="lp__drawer-header">
              <span className="lp__drawer-title">Filters</span>
              <button type="button" className="lp__drawer-close" onClick={onClose} aria-label="Close filters">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="lp__drawer-body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getPageNumbers(page, totalPages) {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);
}

export default function ListingsPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [location, setLocation] = useState("All");
  const [type, setType] = useState("All");
  const [beds, setBeds] = useState("All");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [verified, setVerified] = useState(false);
  const [availability, setAvailability] = useState("All");
  const [sharedOnly, setSharedOnly] = useState(false);
  const [university, setUniversity] = useState("All");
  const [furnishing, setFurnishing] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const searchDebounceRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    fetchListings()
      .then((data) => setAllListings(Array.isArray(data) ? data : []))
      .catch(() => setAllListings([]))
      .finally(() => setLoading(false));
  }, []);

  // Prefill filters from URL params (e.g. coming from homepage search)
  useEffect(() => {
    const urlType = searchParams.get("type");
    const urlBeds = searchParams.get("beds");
    const urlQ = searchParams.get("q");

    if (urlType && PARSER_TYPE_OPTIONS.includes(urlType)) setType(urlType);
    if (urlBeds) setBeds(urlBeds);
    if (urlQ) setSearch(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 280);
    return () => clearTimeout(searchDebounceRef.current);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, location, type, beds, priceMin, priceMax, verified, availability, sharedOnly, university, furnishing, sortBy]);

  const filteredAndSorted = useMemo(() => {
    const min = priceMin !== "" ? Number(priceMin) : null;
    const max = priceMax !== "" ? Number(priceMax) : null;
    const uniAreas = university !== "All" ? (UNIVERSITY_AREA_MAP[university] || []) : [];

    // Parse the search box for type/bed hints (e.g. "self con", "one bed").
    // Explicit chip/dropdown selections always take priority over parsed guesses.
    const parsed = parseSearchQuery(debouncedSearch);
    const effectiveType = type !== "All" ? type : parsed.type;
    const effectiveBeds = beds !== "All" ? beds : (parsed.beds ? String(parsed.beds) : null);
    const q = parsed.text; // leftover free text after stripping type/bed words

    const filtered = allListings.filter((l) => {
      const title = l.title?.toLowerCase() || "";
      const loc = l.location?.toLowerCase() || "";
      const price = Number(l.price) || 0;

      return (
        (!q || title.includes(q) || loc.includes(q)) &&
        (location === "All" || l.location === location) &&
        (!effectiveType || l.type === effectiveType) &&
        (!effectiveBeds || String(l.beds) === effectiveBeds) &&
        (furnishing === "All" || l.furnishing === furnishing) &&
        (min === null || price >= min) &&
        (max === null || price <= max) &&
        (!verified || l.verified === true) &&
        (availability === "All" || l.availability === availability) &&
        (!sharedOnly || l.type === "Shared Room") &&
        (university === "All" || l.nearSchool === university ||
          (uniAreas.length > 0 && uniAreas.includes(l.location)))
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price_asc") return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (sortBy === "price_desc") return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sortBy === "most_viewed") return (Number(b.views) || 0) - (Number(a.views) || 0);
      const at = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
      const bt = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
      return sortBy === "oldest" ? at - bt : bt - at;
    });
  }, [allListings, debouncedSearch, location, type, beds, priceMin, priceMax, verified, availability, sharedOnly, university, furnishing, sortBy]);

  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE);
  const paginatedList = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pills = useMemo(() => {
    const p = [];
    if (debouncedSearch) p.push({ key: "search", label: `"${debouncedSearch}"` });
    if (location !== "All") p.push({ key: "location", label: location });
    if (type !== "All") p.push({ key: "type", label: type });
    if (beds !== "All") p.push({ key: "beds", label: `${beds} Bed${beds !== "1" ? "s" : ""}` });
    if (furnishing !== "All") p.push({ key: "furnishing", label: furnishing });
    if (availability !== "All") p.push({ key: "availability", label: availability });
    if (university !== "All") p.push({ key: "university", label: university });
    if (priceMin) p.push({ key: "priceMin", label: `Min ₦${Number(priceMin).toLocaleString()}` });
    if (priceMax) p.push({ key: "priceMax", label: `Max ₦${Number(priceMax).toLocaleString()}` });
    if (verified) p.push({ key: "verified", label: "Verified only" });
    if (sharedOnly) p.push({ key: "sharedOnly", label: "Shared rooms" });
    if (sortBy !== "newest") p.push({ key: "sortBy", label: SORT_OPTIONS.find((s) => s.value === sortBy)?.label });
    return p;
  }, [debouncedSearch, location, type, beds, priceMin, priceMax, verified, availability, sharedOnly, university, furnishing, sortBy]);

  const removePill = useCallback((key) => {
    const map = {
      search: () => { setSearch(""); setDebouncedSearch(""); },
      location: () => setLocation("All"),
      type: () => setType("All"),
      beds: () => setBeds("All"),
      furnishing: () => setFurnishing("All"),
      availability: () => setAvailability("All"),
      university: () => setUniversity("All"),
      priceMin: () => setPriceMin(""),
      priceMax: () => setPriceMax(""),
      verified: () => setVerified(false),
      sharedOnly: () => setSharedOnly(false),
      sortBy: () => setSortBy("newest"),
    };
    map[key]?.();
  }, []);

  const clearAll = useCallback(() => {
    setSearch(""); setDebouncedSearch(""); setLocation("All"); setType("All");
    setBeds("All"); setPriceMin(""); setPriceMax(""); setVerified(false); setAvailability("All");
    setSharedOnly(false); setUniversity("All"); setFurnishing("All"); setSortBy("newest");
  }, []);

  function scrollToGrid() {
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handlePageChange(p) {
    setPage(p);
    scrollToGrid();
  }

  const filterPanelContent = (
    <>
      <div className="lp__search-wrap">
        <svg className="lp__search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          className="lp__search"
          type="text"
          placeholder="Try 'self con' or 'one bed'…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search listings"
        />
        {search && (
          <button
            type="button"
            className="lp__search-clear"
            onClick={() => { setSearch(""); setDebouncedSearch(""); }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <AccordionSection title="Property type" icon={
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M1 7l6-5 6 5v5a1 1 0 01-1 1H2a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      } defaultOpen>
        <ChipGroup options={TYPE_OPTIONS} value={type} onChange={setType} />
        <label className="lp__checkbox-row">
          <input type="checkbox" checked={sharedOnly} onChange={(e) => setSharedOnly(e.target.checked)} />
          <span>Shared rooms only</span>
        </label>
      </AccordionSection>

      <AccordionSection title="Bedrooms" icon={
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="6" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1 6V4a1 1 0 011-1h10a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      } defaultOpen>
        <ChipGroup options={BED_OPTIONS} value={beds} onChange={setBeds} />
      </AccordionSection>

      <AccordionSection
        title="Location"
        icon={
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1.5a4 4 0 014 4c0 3-4 7-4 7S3 8.5 3 5.5a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="7" cy="5.5" r="1.2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        }
        defaultOpen
      >
        <select
          className="lp__select"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Filter by location"
        >
          {LOCATION_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </AccordionSection>

      <AccordionSection title="Near university" icon={
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="6" width="12" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <path d="M7 1l6 4H1l6-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      }>
        <ChipGroup options={UNI_OPTIONS} value={university} onChange={setUniversity} />
      </AccordionSection>

      <AccordionSection title="Budget" icon={
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      } defaultOpen>
        <div className="lp__preset-chips">
          {PRICE_PRESETS.map((preset) => {
            const active = priceMin === preset.min && priceMax === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                className={`lp__preset-chip${active ? " active" : ""}`}
                onClick={() => {
                  if (active) { setPriceMin(""); setPriceMax(""); }
                  else { setPriceMin(preset.min); setPriceMax(preset.max); }
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="lp__price-inputs">
          <div className="lp__price-input-wrap">
            <span className="lp__price-prefix">₦</span>
            <input
              className="lp__price-input"
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              aria-label="Minimum price"
            />
          </div>
          <span className="lp__price-dash">—</span>
          <div className="lp__price-input-wrap">
            <span className="lp__price-prefix">₦</span>
            <input
              className="lp__price-input"
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              aria-label="Maximum price"
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Furnishing" icon={
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="7" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <rect x="3" y="4" width="8" height="3" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3 11v1.5M11 11v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      }>
        <ChipGroup options={FURNISH_OPTIONS} value={furnishing} onChange={setFurnishing} />
      </AccordionSection>

      <AccordionSection title="Availability" icon={
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="2.5" width="12" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1 6h12M5 1v3M9 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      }>
        <ChipGroup options={AVAIL_OPTIONS} value={availability} onChange={setAvailability} />
      </AccordionSection>

      <AccordionSection title="Trust & safety" icon={
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1.5l5 2v4c0 2.5-2 4.5-5 5.5C4 12 2 10 2 7.5v-4l5-2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M5 7l1.5 1.5L9 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      }>
        <label className="lp__checkbox-row lp__checkbox-row--green">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
          <span>Verified listings only</span>
        </label>
      </AccordionSection>

      {pills.length > 0 && (
        <button type="button" className="lp__sidebar-clear" onClick={clearAll}>
          Clear all filters
        </button>
      )}
    </>
  );

  return (
    <main className="lp">
      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="lp__body lp__body--no-hero">
        {/* Sidebar — desktop */}
        <aside className="lp__sidebar" aria-label="Listing filters">
          <div className="lp__sidebar-inner">
            <div className="lp__sidebar-heading">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Filters
              {pills.length > 0 && (
                <span className="lp__sidebar-pill-count">{pills.length}</span>
              )}
            </div>
            {filterPanelContent}
          </div>
        </aside>

        {/* Mobile filter trigger */}
        <div className="lp__mobile-bar">
          <button
            type="button"
            className="lp__mobile-filter-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open filters"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M1 3h13M3.5 7.5h8M6 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Filters
            {pills.length > 0 && (
              <span className="lp__mobile-pill-count">{pills.length}</span>
            )}
          </button>
          <div className="lp__mobile-sort">
            <label htmlFor="mobile-sort" className="lp__mobile-sort-label">Sort:</label>
            <select
              id="mobile-sort"
              className="lp__select lp__select--inline"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main content */}
        <div className="lp__main" ref={gridRef}>
          {/* Results bar */}
          {!loading && (
            <div className="lp__results-bar">
              <p className="lp__results-count">
                <strong>{filteredAndSorted.length}</strong>{" "}
                listing{filteredAndSorted.length !== 1 ? "s" : ""} found
                {pills.length > 0 && (
                  <span className="lp__filter-active-note">
                    &nbsp;·&nbsp;{pills.length} filter{pills.length !== 1 ? "s" : ""} active
                  </span>
                )}
              </p>
              <div className="lp__sort-wrap">
                <label htmlFor="desktop-sort" className="lp__sort-label">Sort by</label>
                <select
                  id="desktop-sort"
                  className="lp__select lp__select--inline"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active pills */}
          <ActivePills pills={pills} onRemove={removePill} onClearAll={clearAll} />

          {/* Grid */}
          {loading ? (
            <Skeleton />
          ) : paginatedList.length > 0 ? (
            <motion.div
              className="lp__grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              key={`${page}-${sortBy}-${debouncedSearch}`}
            >
              {paginatedList.map((listing) => (
                <motion.div key={listing.id} variants={itemVariants} className="lp__grid-item">
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="lp__empty">
              <div className="lp__empty-icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M5 20l15-13 15 13v14a2 2 0 01-2 2H7a2 2 0 01-2-2V20z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M15 36V24h10v12" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="lp__empty-title">No listings match your filters</h3>
              <p className="lp__empty-sub">Try adjusting your search or removing a filter.</p>
              {pills.length > 0 && (
                <button type="button" className="lp__empty-clear" onClick={clearAll}>
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <motion.nav
              className="lp__pagination"
              aria-label="Listings pagination"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <button
                type="button"
                className="lp__page-btn lp__page-btn--arrow"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Prev
              </button>

              <div className="lp__page-numbers">
                {getPageNumbers(page, totalPages).map((p, idx) =>
                  p === "..." ? (
                    <span key={`e${idx}`} className="lp__page-ellipsis">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={`lp__page-btn${p === page ? " lp__page-btn--active" : ""}`}
                      onClick={() => handlePageChange(p)}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className="lp__page-btn lp__page-btn--arrow"
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                Next
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <span className="lp__page-info">Page {page} of {totalPages}</span>
            </motion.nav>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {filterPanelContent}
        <button
          type="button"
          className="lp__drawer-apply"
          onClick={() => setDrawerOpen(false)}
        >
          Show {filteredAndSorted.length} listing{filteredAndSorted.length !== 1 ? "s" : ""}
        </button>
      </MobileFilterDrawer>
    </main>
  );
}