// app/listings/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ListingCard from "@/components/listings/ListingCard";
import FilterBar from "@/components/listings/FilterBar";
import { fetchListings } from "@/lib/firestoreListings";
import { LOCATION_FILTER_OPTIONS, UNIVERSITY_AREA_MAP } from "@/lib/locations";
import "@/styles/listings-page.css";

const PAGE_SIZE = 12;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const SORT_OPTIONS = [
  { value: "newest",      label: "Newest first"      },
  { value: "oldest",      label: "Oldest first"      },
  { value: "price_asc",   label: "Price: Low → High"  },
  { value: "price_desc",  label: "Price: High → Low"  },
  { value: "most_viewed", label: "Most viewed"        },
];

function getFilterPills({ search, location, type, priceMin, priceMax, verified, availability, sharedOnly, university, furnishing, sortBy }) {
  const pills = [];
  if (search)                pills.push({ key: "search",       label: `"${search}"` });
  if (location !== "All")    pills.push({ key: "location",     label: location });
  if (type !== "All")        pills.push({ key: "type",         label: type });
  if (furnishing !== "All")  pills.push({ key: "furnishing",   label: furnishing });
  if (availability !== "All") pills.push({ key: "availability", label: availability });
  if (university !== "All")  pills.push({ key: "university",   label: university });
  if (priceMin)              pills.push({ key: "priceMin",     label: `Min ₦${Number(priceMin).toLocaleString()}` });
  if (priceMax)              pills.push({ key: "priceMax",     label: `Max ₦${Number(priceMax).toLocaleString()}` });
  if (verified)              pills.push({ key: "verified",     label: "Verified only" });
  if (sharedOnly)            pills.push({ key: "sharedOnly",   label: "Shared rooms" });
  if (sortBy !== "newest")   pills.push({ key: "sortBy",       label: SORT_OPTIONS.find(s => s.value === sortBy)?.label });
  return pills;
}

export default function ListingsPage() {
  const [search, setSearch]               = useState("");
  const [location, setLocation]           = useState("All");
  const [type, setType]                   = useState("All");
  const [priceMin, setPriceMin]           = useState("");
  const [priceMax, setPriceMax]           = useState("");
  const [verified, setVerified]           = useState(false);
  const [availability, setAvailability]   = useState("All");
  const [sharedOnly, setSharedOnly]       = useState(false);
  const [university, setUniversity]       = useState("All");
  const [furnishing, setFurnishing]       = useState("All");
  const [sortBy, setSortBy]               = useState("newest");
  const [page, setPage]                   = useState(1);
  const [allListings, setAllListings]     = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    async function loadListings() {
      try {
        const data = await fetchListings();
        setAllListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setAllListings([]);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, location, type, priceMin, priceMax, verified, availability, sharedOnly, university, furnishing, sortBy]);

  const filteredAndSorted = useMemo(() => {
    const min      = priceMin !== "" ? Number(priceMin) : null;
    const max      = priceMax !== "" ? Number(priceMax) : null;
    const uniAreas = university !== "All" ? (UNIVERSITY_AREA_MAP[university] || []) : [];

    const filtered = allListings.filter((listing) => {
      const title           = listing.title?.toLowerCase()    || "";
      const listingLocation = listing.location?.toLowerCase() || "";
      const listingPrice    = Number(listing.price)           || 0;

      const matchesSearch       = !search        || title.includes(search.toLowerCase()) || listingLocation.includes(search.toLowerCase());
      const matchesLocation     = location      === "All" || listing.location    === location;
      const matchesType         = type          === "All" || listing.type        === type;
      const matchesFurnishing   = furnishing    === "All" || listing.furnishing  === furnishing;
      const matchesPriceMin     = min === null  || listingPrice >= min;
      const matchesPriceMax     = max === null  || listingPrice <= max;
      const matchesVerified     = !verified     || listing.verified     === true;
      const matchesAvailability = availability  === "All" || listing.availability === availability;
      const matchesShared       = !sharedOnly   || listing.type         === "Shared Room";
      const matchesUniversity   = university    === "All" || listing.nearSchool === university || (uniAreas.length > 0 && uniAreas.includes(listing.location));

      return matchesSearch && matchesLocation && matchesType && matchesFurnishing &&
             matchesPriceMin && matchesPriceMax && matchesVerified &&
             matchesAvailability && matchesShared && matchesUniversity;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price_asc")   return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (sortBy === "price_desc")  return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sortBy === "most_viewed") return (Number(b.views) || 0) - (Number(a.views) || 0);
      if (sortBy === "oldest") {
        const at = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
        const bt = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
        return at - bt;
      }
      const at = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
      const bt = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
      return bt - at;
    });
  }, [allListings, search, location, type, priceMin, priceMax, verified, availability, sharedOnly, university, furnishing, sortBy]);

  const totalPages    = Math.ceil(filteredAndSorted.length / PAGE_SIZE);
  const paginatedList = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filterPills   = getFilterPills({ search, location, type, priceMin, priceMax, verified, availability, sharedOnly, university, furnishing, sortBy });

  function removePill(key) {
    const map = {
      search:       () => setSearch(""),
      location:     () => setLocation("All"),
      type:         () => setType("All"),
      furnishing:   () => setFurnishing("All"),
      availability: () => setAvailability("All"),
      university:   () => setUniversity("All"),
      priceMin:     () => setPriceMin(""),
      priceMax:     () => setPriceMax(""),
      verified:     () => setVerified(false),
      sharedOnly:   () => setSharedOnly(false),
      sortBy:       () => setSortBy("newest"),
    };
    map[key]?.();
  }

  function handleClearFilters() {
    setSearch(""); setLocation("All"); setType("All"); setPriceMin(""); setPriceMax("");
    setVerified(false); setAvailability("All"); setSharedOnly(false);
    setUniversity("All"); setFurnishing("All"); setSortBy("newest");
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getPageNumbers() {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
      .reduce((acc, p, idx, arr) => {
        if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
        acc.push(p);
        return acc;
      }, []);
  }

  return (
    <main className="listings-page">
      <motion.div
        className="listings-page__header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="listings-page__tag">Browse Properties</p>
        <h1>Housing in Port Harcourt</h1>
        <p>Search and filter listings by area, type, budget and more.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <FilterBar
          search={search}               setSearch={setSearch}
          location={location}           setLocation={setLocation}
          type={type}                   setType={setType}
          priceMin={priceMin}           setPriceMin={setPriceMin}
          priceMax={priceMax}           setPriceMax={setPriceMax}
          verified={verified}           setVerified={setVerified}
          availability={availability}   setAvailability={setAvailability}
          sharedOnly={sharedOnly}       setSharedOnly={setSharedOnly}
          university={university}       setUniversity={setUniversity}
          furnishing={furnishing}       setFurnishing={setFurnishing}
          sortBy={sortBy}               setSortBy={setSortBy}
          locationOptions={LOCATION_FILTER_OPTIONS}
        />
      </motion.div>

      {/* Active filter pills */}
      <AnimatePresence>
        {filterPills.length > 0 && (
          <motion.div
            className="listings-page__pills"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {filterPills.map((pill) => (
              <motion.button
                key={pill.key}
                className="listings-page__pill"
                onClick={() => removePill(pill.key)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
                {pill.label} <span>✕</span>
              </motion.button>
            ))}
            {filterPills.length > 1 && (
              <button className="listings-page__pill listings-page__pill--clear" onClick={handleClearFilters}>
                Clear all
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results row */}
      {!loading && (
        <div className="listings-page__results-row">
          <p className="listings-page__results-count">
            {filteredAndSorted.length} listing{filteredAndSorted.length !== 1 ? "s" : ""} found
            {filterPills.length > 0 && (
              <span className="listings-page__filter-count">
                · {filterPills.length} filter{filterPills.length !== 1 ? "s" : ""} active
              </span>
            )}
          </p>
          <select
            className="listings-page__sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="listings-page__grid">
          <div className="listings-page__loading"><p>Loading properties...</p></div>
        </div>
      ) : paginatedList.length > 0 ? (
        <motion.div
          className="listings-page__grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={`${page}-${sortBy}-${search}`}
        >
          {paginatedList.map((listing) => (
            <motion.div key={listing.id} variants={itemVariants} style={{ height: "100%" }}>
              <ListingCard listing={listing} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="listings-page__grid">
          <div className="listings-page__empty">
            <h3>No listings found</h3>
            <p>Try adjusting your filters or search terms.</p>
            {filterPills.length > 0 && (
              <button className="listings-page__clear-btn" onClick={handleClearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <motion.div
          className="listings-page__pagination"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            className="listings-page__page-btn"
            onClick={() => { setPage((p) => Math.max(1, p - 1)); scrollToTop(); }}
            disabled={page === 1}
          >
            ← Prev
          </button>

          <div className="listings-page__page-numbers">
            {getPageNumbers().map((p, idx) =>
              p === "..." ? (
                <span key={"e" + idx} className="listings-page__page-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  className={"listings-page__page-num" + (p === page ? " active" : "")}
                  onClick={() => { setPage(p); scrollToTop(); }}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            className="listings-page__page-btn"
            onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); scrollToTop(); }}
            disabled={page === totalPages}
          >
            Next →
          </button>

          <span className="listings-page__page-info">
            Page {page} of {totalPages}
          </span>
        </motion.div>
      )}
    </main>
  );
}