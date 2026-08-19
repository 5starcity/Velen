"use client";

import { useState, useRef, useEffect } from "react";

export default function LocationSelect({
  value,
  onChange,
  ustAreas = [],
  otherAreas = [],
  placeholder = "Search for an area…",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  const allAreas = [...ustAreas, ...otherAreas];
  const selected = allAreas.find((l) => l.value === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function matches(loc) {
    return loc.label.toLowerCase().includes(query.trim().toLowerCase());
  }

  const filteredUst = query ? ustAreas.filter(matches) : ustAreas;
  const filteredOther = query ? otherAreas.filter(matches) : otherAreas;
  const hasResults = filteredUst.length > 0 || filteredOther.length > 0;

  function selectLocation(loc) {
    onChange(loc.value);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="alp__location-field" ref={wrapperRef}>
      <input
        type="text"
        className="alp__location-input"
        placeholder={placeholder}
        value={open ? query : selected?.label || ""}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
      />

      {open && (
        <div className="alp__location-dropdown">
          {!hasResults && (
            <div className="alp__location-empty">
              No area matches "{query}"
            </div>
          )}

          {filteredUst.length > 0 && (
            <div className="alp__location-group">
              <div className="alp__location-group-label">UST Gate Areas</div>
              {filteredUst.map((loc) => (
                <button
                  type="button"
                  key={loc.value}
                  className={
                    "alp__location-option" +
                    (loc.value === value ? " alp__location-option--selected" : "")
                  }
                  onClick={() => selectLocation(loc)}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          )}

          {filteredOther.length > 0 && (
            <div className="alp__location-group">
              <div className="alp__location-group-label">Other Port Harcourt Areas</div>
              {filteredOther.map((loc) => (
                <button
                  type="button"
                  key={loc.value}
                  className={
                    "alp__location-option" +
                    (loc.value === value ? " alp__location-option--selected" : "")
                  }
                  onClick={() => selectLocation(loc)}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}