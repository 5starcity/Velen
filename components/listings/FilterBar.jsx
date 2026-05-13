// components/listings/FilterBar.jsx
"use client";

import { UST_GATE_AREAS, OTHER_PH_AREAS, LOCATIONS, UNIVERSITIES } from "@/lib/locations";
import "@/styles/filter-bar.css";

const ustAreas   = LOCATIONS.filter((l) => UST_GATE_AREAS.includes(l.value));
const otherAreas = LOCATIONS.filter((l) => OTHER_PH_AREAS.includes(l.value));

const SORT_OPTIONS = [
  { value: "newest",      label: "Newest first"      },
  { value: "oldest",      label: "Oldest first"      },
  { value: "price_asc",   label: "Price: Low → High"  },
  { value: "price_desc",  label: "Price: High → Low"  },
  { value: "most_viewed", label: "Most viewed"        },
];

export default function FilterBar({
  search, setSearch,
  location, setLocation,
  type, setType,
  priceMin, setPriceMin,
  priceMax, setPriceMax,
  verified, setVerified,
  availability, setAvailability,
  sharedOnly, setSharedOnly,
  university, setUniversity,
  furnishing, setFurnishing,
  sortBy, setSortBy,
}) {
  function handleReset() {
    setSearch(""); setLocation("All"); setType("All"); setPriceMin(""); setPriceMax("");
    setVerified(false); setAvailability("All"); setSharedOnly(false);
    setUniversity("All"); setFurnishing("All"); setSortBy("newest");
  }

  const hasActiveFilters =
    search !== "" || location !== "All" || type !== "All" ||
    priceMin !== "" || priceMax !== "" || verified ||
    availability !== "All" || sharedOnly || university !== "All" ||
    furnishing !== "All" || sortBy !== "newest";

  return (
    <div className="filter-bar">

      {/* Row 1 — Search + Location + Type + Availability */}
      <div className="filter-bar__row">
        <div className="filter-bar__search-wrap">
          <input
            type="text"
            placeholder="Search by title or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-bar__input"
          />
          {search && (
            <button className="filter-bar__clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        <select value={location} onChange={(e) => setLocation(e.target.value)} className="filter-bar__select">
          <option value="All">All Areas</option>
          <optgroup label="Near UST">
            {ustAreas.map((loc) => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
          </optgroup>
          <optgroup label="Port Harcourt">
            {otherAreas.map((loc) => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
          </optgroup>
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)} className="filter-bar__select">
          <option value="All">All Types</option>
          <option value="Self Contain">Self Contain</option>
          <option value="Single Room">Single Room</option>
          <option value="Mini Flat">Mini Flat</option>
          <option value="1 Bedroom Flat">1 Bedroom Flat</option>
          <option value="2 Bedroom Flat">2 Bedroom Flat</option>
          <option value="3 Bedroom Flat">3 Bedroom Flat</option>
          <option value="Shared Room">Shared Room</option>
          <option value="Studio Apartment">Studio Apartment</option>
        </select>

        <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="filter-bar__select">
          <option value="All">Any Availability</option>
          <option value="Available Now">Available Now</option>
          <option value="Available Soon">Available Soon</option>
          <option value="Not Available">Not Available</option>
        </select>
      </div>

      {/* Row 2 — University + Furnishing + Price range + Sort */}
      <div className="filter-bar__row filter-bar__row--secondary">
        <select value={university} onChange={(e) => setUniversity(e.target.value)} className="filter-bar__select filter-bar__select--university">
          {UNIVERSITIES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>

        <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className="filter-bar__select">
          <option value="All">Any Furnishing</option>
          <option value="Furnished">Furnished</option>
          <option value="Unfurnished">Unfurnished</option>
          <option value="Partly Furnished">Partly Furnished</option>
        </select>

        <div className="filter-bar__price-range">
          <input
            type="number"
            placeholder="Min (₦)"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="filter-bar__input filter-bar__input--price"
            min="0"
          />
          <span className="filter-bar__price-sep">–</span>
          <input
            type="number"
            placeholder="Max (₦)"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="filter-bar__input filter-bar__input--price"
            min="0"
          />
        </div>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-bar__select filter-bar__select--sort">
          {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>

        <div className="filter-bar__toggles">
          <label className="filter-bar__toggle">
            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
            <span>Verified only</span>
          </label>
          <label className="filter-bar__toggle">
            <input type="checkbox" checked={sharedOnly} onChange={(e) => setSharedOnly(e.target.checked)} />
            <span>Shared rooms</span>
          </label>
        </div>

        {hasActiveFilters && (
          <button className="filter-bar__reset" onClick={handleReset}>Reset</button>
        )}
      </div>
    </div>
  );
}