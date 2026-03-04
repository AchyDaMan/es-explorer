// src/components/Explorer.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ types */

interface SearchResult {
  total: number;
  page: number;
  pageSize: number;
  rows: Record<string, unknown>[];
}

const COLUMNS = [
  { key: "restaurant_name", label: "Restaurant" },
  { key: "restaurant_source", label: "Source" },
  { key: "city", label: "City" },
  { key: "state_or_province", label: "State" },
  { key: "address", label: "Address" },
  { key: "menu_item_name", label: "Menu Item" },
  { key: "menu_section", label: "Section" },
  { key: "price", label: "Price" },
  { key: "datetime_timestamp", label: "Timestamp" },
] as const;

const PAGE_SIZE = 50;

/* ------------------------------------------------------------ component */

export default function Explorer() {
  /* sources dropdown */
  const [allSources, setAllSources] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* airports dropdown */
  const [allAirports, setAllAirports] = useState<string[]>([]);
  const [selectedAirports, setSelectedAirports] = useState<Set<string>>(new Set());
  const [airportDropdownOpen, setAirportDropdownOpen] = useState(false);
  const airportDropdownRef = useRef<HTMLDivElement>(null);

  /* table data */
  const [data, setData] = useState<SearchResult | null>(null);
  const [page, setPage] = useState(1);

  /* ui state */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- close dropdowns on outside click ---- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (airportDropdownRef.current && !airportDropdownRef.current.contains(e.target as Node)) {
        setAirportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---- fetch sources on mount ---- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sources");
        if (!res.ok) throw new Error(`Failed to load sources (${res.status})`);
        const json = await res.json();
        if (Array.isArray(json)) setAllSources(json);
        else throw new Error(json.error ?? "Bad response");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load sources");
      }
    })();
  }, []);

  /* ---- fetch airports on mount ---- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/airports");
        if (!res.ok) throw new Error(`Failed to load airports (${res.status})`);
        const json = await res.json();
        if (Array.isArray(json)) setAllAirports(json);
        else throw new Error(json.error ?? "Bad response");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load airports");
      }
    })();
  }, []);

  /* ---- fetch table data ---- */
  const fetchData = useCallback(async (sources: Set<string>, airports: Set<string>, pg: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sources.size > 0) params.set("sources", [...sources].join(","));
      if (airports.size > 0) params.set("airports", [...airports].join(","));
      params.set("page", String(pg));
      params.set("pageSize", String(PAGE_SIZE));
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json as SearchResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search error");
    } finally {
      setLoading(false);
    }
  }, []);

  /* initial load + refetch on filter/page change */
  useEffect(() => {
    fetchData(selected, selectedAirports, page);
  }, [selected, selectedAirports, page, fetchData]);

  /* ---- handlers ---- */
  const toggleSource = (s: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
    setPage(1);
  };

  const toggleAirport = (a: string) => {
    setSelectedAirports((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setSelected(new Set());
    setSelectedAirports(new Set());
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  /* ---- format helpers ---- */
  const fmt = (key: string, val: unknown): string => {
    if (val == null || val === "") return "—";
    if (key === "datetime_timestamp") {
      const d = new Date(val as string);
      return isNaN(d.getTime()) ? String(val) : d.toLocaleString();
    }
    if (key === "price") {
      const n = Number(val);
      return isNaN(n) ? String(val) : `$${n.toFixed(2)}`;
    }
    return String(val);
  };

  /* ---------------------------------------------------------------- render */
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 16px" }}>
      {/* ---- Header ---- */}
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>
          ES Explorer{" "}
          <span style={{ fontWeight: 400, color: "#888", fontSize: 14 }}>
            compstore_menu_latest
          </span>
        </h1>
      </header>

      {/* ---- Toolbar ---- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Multi-select dropdown */}
        <div ref={dropdownRef} style={{ position: "relative", minWidth: 240 }}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            style={{
              ...btnStyle,
              width: "100%",
              justifyContent: "space-between",
              display: "flex",
              background: "#fff",
              border: "1px solid #d0d5dd",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selected.size === 0
                ? "All sources"
                : `${selected.size} source${selected.size > 1 ? "s" : ""} selected`}
            </span>
            <span style={{ marginLeft: 8, fontSize: 12 }}>▾</span>
          </button>
          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                width: "100%",
                maxHeight: 260,
                overflowY: "auto",
                background: "#fff",
                border: "1px solid #d0d5dd",
                borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                zIndex: 10,
              }}
            >
              {allSources.length === 0 && (
                <div style={{ padding: "10px 12px", color: "#888", fontSize: 13 }}>
                  No sources loaded
                </div>
              )}
              {allSources.map((s) => (
                <label
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 12px",
                    cursor: "pointer",
                    fontSize: 13,
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(s)}
                    onChange={() => toggleSource(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Airport multi-select dropdown */}
        <div ref={airportDropdownRef} style={{ position: "relative", minWidth: 240 }}>
          <button
            onClick={() => setAirportDropdownOpen((o) => !o)}
            style={{
              ...btnStyle,
              width: "100%",
              justifyContent: "space-between",
              display: "flex",
              background: "#fff",
              border: "1px solid #d0d5dd",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedAirports.size === 0
                ? "All airports"
                : `${selectedAirports.size} airport${selectedAirports.size > 1 ? "s" : ""} selected`}
            </span>
            <span style={{ marginLeft: 8, fontSize: 12 }}>▾</span>
          </button>
          {airportDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                width: "100%",
                maxHeight: 260,
                overflowY: "auto",
                background: "#fff",
                border: "1px solid #d0d5dd",
                borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                zIndex: 10,
              }}
            >
              {allAirports.length === 0 && (
                <div style={{ padding: "10px 12px", color: "#888", fontSize: 13 }}>
                  No airports loaded
                </div>
              )}
              {allAirports.map((a) => (
                <label
                  key={a}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 12px",
                    cursor: "pointer",
                    fontSize: 13,
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAirports.has(a)}
                    onChange={() => toggleAirport(a)}
                  />
                  {a}
                </label>
              ))}
            </div>
          )}
        </div>

        <button onClick={clearFilters} style={{ ...btnStyle, background: "#fff", border: "1px solid #d0d5dd" }}>
          Clear
        </button>
        <button
          onClick={() => fetchData(selected, selectedAirports, page)}
          style={{ ...btnStyle, background: "#1a1a2e", color: "#fff", border: "none" }}
        >
          Refresh
        </button>

        {data && (
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#666" }}>
            {data.total.toLocaleString()} total hits
          </span>
        )}
      </div>

      {/* ---- Error ---- */}
      {error && (
        <div
          style={{
            background: "#fff0f0",
            border: "1px solid #ffcaca",
            borderRadius: 6,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#c00",
            fontSize: 13,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ---- Loading ---- */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#888", fontSize: 14 }}>
          Loading…
        </div>
      )}

      {/* ---- Table ---- */}
      {!loading && data && (
        <>
          <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #e0e0e0" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                background: "#fff",
              }}
            >
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        background: "#f8f9fb",
                        borderBottom: "2px solid #e0e0e0",
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                        color: "#333",
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={COLUMNS.length}
                      style={{ textAlign: "center", padding: 40, color: "#999" }}
                    >
                      No results found.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: "1px solid #f0f0f0" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background = "#f8f9ff")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")
                      }
                    >
                      {COLUMNS.map((c) => (
                        <td
                          key={c.key}
                          style={{
                            padding: "8px 12px",
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#444",
                          }}
                          title={String(row[c.key] ?? "")}
                        >
                          {fmt(c.key, row[c.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ---- Pagination ---- */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginTop: 16,
              fontSize: 13,
            }}
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                ...btnStyle,
                background: "#fff",
                border: "1px solid #d0d5dd",
                opacity: page <= 1 ? 0.4 : 1,
                cursor: page <= 1 ? "default" : "pointer",
              }}
            >
              ← Prev
            </button>
            <span style={{ color: "#555" }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                ...btnStyle,
                background: "#fff",
                border: "1px solid #d0d5dd",
                opacity: page >= totalPages ? 0.4 : 1,
                cursor: page >= totalPages ? "default" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* shared button style */
const btnStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  lineHeight: 1.4,
};
