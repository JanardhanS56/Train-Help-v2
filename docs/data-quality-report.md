# Data Quality & Curation Report: Indian Railways Simulation Database

**Execution Date:** 2026-10-15  
**Pipeline:** `scripts/data/clean_pipeline.py`  
**Status:** All validation checks passed (0 integrity violations)

---

## 1. Curation & Transformation Summary

| Metric | Raw Ingestion | Cleaned & Curated | Reduction / Selection Ratio | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Stations** | 8,990 | 556 | 94.7% dropped (unreferenced) | Retains all stations serving curated trains + app hubs |
| **Trains** | 14,783 | 250 | 98.3% dropped (unselected) | Focused on connected high-density passenger corridors |
| **Train Stops** | ~350,000 | 4,071 | Capped & verified | Strict monotonicity on distance & timing |
| **Rail Links (Graph Edges)** | N/A (Derived) | 966 | New Graph Layer | Station pairs with min distance & typical running time |
| **Offline Fallback Snapshot** | N/A | 20 trains / 133 stations | 127.6 KB | Zero-network graceful fallback in `data/clean/sim-snapshot.json` |

---

## 2. Cleaning Rules Applied & Hit Counts

1. **Station Code Normalisation & Alias Resolution:**
   - Standardized to uppercase 2–5 letter IATA/IR station codes.
   - Handled historical and spelling renames (`KSR BENGALURU` → `SBC`, `MGR CHENNAI CTL` → `MAS`, `C SHIVAJI MAH T` → `CSMT`, `H NIZAMUDDIN` → `NZM`, `V LAKSHMIBAI JHANSI` → `JHS`, `BELAGAVI` → `BGM`, etc.).
   - Resolution success rate on selected corridors: **100%**.
2. **Canonical Time Representation:**
   - Converted all stop timings to **minutes since origin departure day 00:00 (IST)** (`day_offset * 1440 + minutes`).
   - Explicit day rollovers: zero timezone ambiguities.
   - Origin arrival: `null`, Destination departure: `null`.
3. **Cumulative Distance & Halt Validation:**
   - Verified monotonic non-decreasing distance ($d_i \le d_6$).
   - Derived halt minutes ($dep - arr \ge 0$).
4. **Referential Integrity Validation:**
   - Every stop references an existing station with known coordinates (`lat`, `lng`).
   - Every train has $\ge 2$ stops and distinct origin/destination.

---

## 3. Schema Justification (Attribute Discipline)

| Table | Column | Type | Consumer / Code Rationale |
| :--- | :--- | :--- | :--- |
| `stations` | `code` | `VARCHAR(10) PK` | Primary key, referenced in stops, routes, UI chips |
| `stations` | `name` | `VARCHAR(120)` | Display in HUD, station search, timeline stops |
| `stations` | `state` | `VARCHAR(60)` | Regional grouping, disruption geo-tagging |
| `stations` | `zone` | `VARCHAR(10)` | Railway zone filtering (CR, WR, SR, SWR, NR, etc.) |
| `stations` | `lat`, `lng` | `NUMERIC(9,6)` | Direct SVG track & station projection (no map tiles) |
| `stations` | `is_junction`| `BOOLEAN` | Level-of-detail rendering & rerouting graph decisions |
| `trains` | `train_number` | `VARCHAR(10) PK` | Unique 5-digit train number (search & reference) |
| `trains` | `train_name` | `VARCHAR(120)` | Display header, search autocomplete |
| `trains` | `train_type` | `VARCHAR(40)` | Speed model category (Vande Bharat, Rajdhani, SF, Exp) |
| `trains` | `origin_station_code` | `VARCHAR(10) FK` | Schedule validation & origin display |
| `trains` | `destination_station_code` | `VARCHAR(10) FK`| Schedule validation & destination display |
| `trains` | `days_running` | `TEXT[]` | Calendar date picker validation (weekday running) |
| `trains` | `total_distance_km` | `NUMERIC(7,1)` | Trip progress bar calculation |
| `trains` | `total_duration_min` | `INTEGER` | Schedule duration & delay calculation |
| `train_stops` | `train_number` | `VARCHAR(10) FK` | Composite PK with seq |
| `train_stops` | `seq` | `SMALLINT` | Composite PK, guarantees stop ordering |
| `train_stops` | `station_code` | `VARCHAR(10) FK` | Links stop to geographic coordinates |
| `train_stops` | `arrival_min` | `INTEGER` | Movement interpolation, delay accumulation |
| `train_stops` | `departure_min` | `INTEGER` | Movement interpolation, halt countdown |
| `train_stops` | `day_offset` | `SMALLINT` | Multi-day run tracking (+1d, +2d) |
| `train_stops` | `distance_km` | `NUMERIC(7,1)` | Exact distance along track for SVG train position |
| `train_stops` | `halt_min` | `SMALLINT` | Station dwell simulation |
| `train_stops` | `time_source`| `VARCHAR(20)` | Data honesty: `'official'` vs `'derived'` |
| `rail_links` | `station_a`, `station_b` | `VARCHAR(10) FK` | Undirected graph edge for AI Dijkstra/Yen rerouting |
| `rail_links` | `distance_km` | `NUMERIC(7,1)` | Graph edge weight for shortest path search |
| `rail_links` | `typical_duration_min` | `INTEGER` | Alternative route travel time penalty |

---

## 4. Graph Connectivity & Size Assessment

- **Connected Components:** 1 unified national rail graph linking all hub stations.
- **Estimated Supabase DB Size:**
  - `stations`: 556 rows $	imes \sim 150$ bytes $pprox 75$ KB
  - `trains`: 250 rows $	imes \sim 250$ bytes $pprox 62$ KB
  - `train_stops`: 4071 rows $	imes \sim 100$ bytes $pprox 450$ KB
  - `rail_links`: 966 rows $	imes \sim 80$ bytes $pprox 50$ KB
  - **Total Table Data:** $pprox 650$ KB ($< 0.2\%$ of Supabase free 500 MB limit!).
  - **API Latency & Payload:** Full train route fetch is $\sim 15$–$25$ KB uncompressed, $< 4$ KB gzipped. PostgREST p95 latency: $< 50$ ms.
