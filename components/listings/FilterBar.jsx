"use client";

import "@/styles/filter-bar.css";

export default function FilterBar({
  search,
  setSearch,
  location,
  setLocation,
  type,
  setType,
  price,
  setPrice,
  verified,
  setVerified,
  availability,
  setAvailability,
}) {
  function handleReset() {
    setSearch("");
    setLocation("All");
    setType("All");
    setPrice("All");
    setVerified(false);
    setAvailability("All");
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar__search-wrap">
        <input
          type="text"
          placeholder="Search by title or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-bar__input"
        />
        {search && (
          <button className="filter-bar__clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      <select
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="filter-bar__select"
      >
        <option value="All">All Locations</option>
        <optgroup label="Near RSU">
          <option value="Alakahia">Alakahia</option>
          <option value="Choba">Choba</option>
          <option value="Rumuosi">Rumuosi</option>
          <option value="Nkpolu">Nkpolu</option>
          <option value="Rumuola">Rumuola</option>
          <option value="Eligbam">Eligbam</option>
        </optgroup>
        <optgroup label="Port Harcourt">
          <option value="Woji">Woji</option>
          <option value="Rumuokoro">Rumuokoro</option>
          <option value="Rumuigbo">Rumuigbo</option>
          <option value="Trans Amadi">Trans Amadi</option>
          <option value="GRA">GRA</option>
          <option value="D-Line">D-Line</option>
          <option value="Mile 1">Mile 1</option>
          <option value="Mile 3">Mile 3</option>
          <option value="Eliozu">Eliozu</option>
          <option value="Rumuodara">Rumuodara</option>
          <option value="Rumola">Rumola</option>
          <option value="Ozuoba">Ozuoba</option>
        </optgroup>
      </select>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="filter-bar__select"
      >
        <option value="All">All Types</option>
        <option value="Self Contain">Self Contain</option>
        <option value="Single Room">Single Room</option>
        <option value="Mini Flat">Mini Flat</option>
        <option value="2 Bedroom Flat">2 Bedroom Flat</option>
        <option value="3 Bedroom Flat">3 Bedroom Flat</option>
        <option value="Shared Room">Shared Room</option>
        <option value="Studio Apartment">Studio Apartment</option>
      </select>

      <select
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="filter-bar__select"
      >
        <option value="All">Any Price</option>
        <option value="100000">Up to ₦100,000</option>
        <option value="200000">Up to ₦200,000</option>
        <option value="300000">Up to ₦300,000</option>
        <option value="500000">Up to ₦500,000</option>
        <option value="700000">Up to ₦700,000</option>
        <option value="1000000">Up to ₦1,000,000</option>
      </select>

      <select
        value={availability}
        onChange={(e) => setAvailability(e.target.value)}
        className="filter-bar__select"
      >
        <option value="All">Any Availability</option>
        <option value="Available Now">Available Now</option>
        <option value="Available Soon">Available Soon</option>
        <option value="Not Available">Not Available</option>
      </select>

      <div className="filter-bar__bottom">
        <label className="filter-bar__verified">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
          />
          <span>Verified only</span>
        </label>

        <button className="filter-bar__reset" onClick={handleReset}>
          Reset Filters
        </button>
      </div>
    </div>
  );
}