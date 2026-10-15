-- ==============================================================================
-- 0001_initial_railway_schema.sql
-- TravelRescue AI: Core Railway Network & Simulation Schema
-- ==============================================================================

-- 1. STATIONS TABLE
CREATE TABLE IF NOT EXISTS stations (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    state VARCHAR(60) NOT NULL,
    zone VARCHAR(10) NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    is_junction BOOLEAN NOT NULL DEFAULT FALSE,
    route_count NUMERIC(6,1) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TRAINS TABLE
CREATE TABLE IF NOT EXISTS trains (
    train_number VARCHAR(10) PRIMARY KEY,
    train_name VARCHAR(120) NOT NULL,
    train_type VARCHAR(40) NOT NULL,
    railway_zone VARCHAR(60) NOT NULL,
    origin_station_code VARCHAR(10) NOT NULL REFERENCES stations(code) ON DELETE RESTRICT,
    destination_station_code VARCHAR(10) NOT NULL REFERENCES stations(code) ON DELETE RESTRICT,
    origin_name VARCHAR(120) NOT NULL,
    destination_name VARCHAR(120) NOT NULL,
    days_running TEXT[] NOT NULL,
    total_distance_km NUMERIC(7,1) NOT NULL,
    total_duration_min INTEGER NOT NULL,
    stops_count INTEGER NOT NULL,
    has_official_timing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_train_origin_diff_dest CHECK (origin_station_code <> destination_station_code),
    CONSTRAINT ck_train_distance_pos CHECK (total_distance_km > 0),
    CONSTRAINT ck_train_duration_pos CHECK (total_duration_min > 0)
);

-- 3. TRAIN STOPS TABLE
CREATE TABLE IF NOT EXISTS train_stops (
    train_number VARCHAR(10) NOT NULL REFERENCES trains(train_number) ON DELETE CASCADE,
    seq SMALLINT NOT NULL,
    station_code VARCHAR(10) NOT NULL REFERENCES stations(code) ON DELETE RESTRICT,
    station_name VARCHAR(120) NOT NULL,
    arrival_min INTEGER,          -- Minutes from origin departure day 00:00 IST
    departure_min INTEGER,        -- Minutes from origin departure day 00:00 IST
    arrival_formatted VARCHAR(20),
    departure_formatted VARCHAR(20),
    day_offset SMALLINT NOT NULL DEFAULT 0,
    distance_km NUMERIC(7,1) NOT NULL DEFAULT 0,
    halt_min SMALLINT NOT NULL DEFAULT 0,
    time_source VARCHAR(20) NOT NULL DEFAULT 'derived' CHECK (time_source IN ('official', 'derived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (train_number, seq),
    CONSTRAINT ck_stop_seq_pos CHECK (seq >= 1),
    CONSTRAINT ck_stop_halt_valid CHECK (halt_min >= 0),
    CONSTRAINT ck_stop_arr_dep_order CHECK (
        arrival_min IS NULL OR departure_min IS NULL OR arrival_min <= departure_min
    )
);

-- 4. RAIL LINKS TABLE (GRAPH EDGES FOR SIMULATION ROUTE PLANNING)
CREATE TABLE IF NOT EXISTS rail_links (
    station_a VARCHAR(10) NOT NULL REFERENCES stations(code) ON DELETE RESTRICT,
    station_b VARCHAR(10) NOT NULL REFERENCES stations(code) ON DELETE RESTRICT,
    distance_km NUMERIC(7,1) NOT NULL,
    typical_duration_min INTEGER NOT NULL,
    traversals INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (station_a, station_b),
    CONSTRAINT ck_station_pair_ordered CHECK (station_a < station_b),
    CONSTRAINT ck_link_dist_pos CHECK (distance_km > 0),
    CONSTRAINT ck_link_dur_pos CHECK (typical_duration_min > 0)
);

-- 5. INDEXES FOR FAST ACCESS PATHS
CREATE INDEX IF NOT EXISTS idx_stations_name_prefix ON stations (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_stations_is_junction ON stations (is_junction);
CREATE INDEX IF NOT EXISTS idx_stations_zone ON stations (zone);

CREATE INDEX IF NOT EXISTS idx_trains_name_prefix ON trains (train_name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_trains_origin ON trains (origin_station_code);
CREATE INDEX IF NOT EXISTS idx_trains_dest ON trains (destination_station_code);
CREATE INDEX IF NOT EXISTS idx_trains_type ON trains (train_type);

CREATE INDEX IF NOT EXISTS idx_train_stops_station ON train_stops (station_code);
CREATE INDEX IF NOT EXISTS idx_train_stops_train_seq ON train_stops (train_number, seq);
CREATE INDEX IF NOT EXISTS idx_train_stops_arr_dep ON train_stops (arrival_min, departure_min);

CREATE INDEX IF NOT EXISTS idx_rail_links_station_a ON rail_links (station_a);
CREATE INDEX IF NOT EXISTS idx_rail_links_station_b ON rail_links (station_b);

-- 6. ROW LEVEL SECURITY (RLS) - READ-ONLY POLICIES FOR CLIENTS
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trains ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE rail_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to stations"
    ON stations FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public read access to trains"
    ON trains FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public read access to train_stops"
    ON train_stops FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public read access to rail_links"
    ON rail_links FOR SELECT
    TO anon, authenticated
    USING (true);

-- 7. HELPER FUNCTION: trains_between(from, to)
CREATE OR REPLACE FUNCTION trains_between(p_from VARCHAR(10), p_to VARCHAR(10))
RETURNS TABLE (
    train_number VARCHAR(10),
    train_name VARCHAR(120),
    train_type VARCHAR(40),
    from_seq SMALLINT,
    to_seq SMALLINT,
    departure_min INTEGER,
    arrival_min INTEGER,
    departure_formatted VARCHAR(20),
    arrival_formatted VARCHAR(20),
    duration_min INTEGER
)
LANGUAGE sql STABLE
AS $$
    SELECT 
        t.train_number,
        t.train_name,
        t.train_type,
        s1.seq AS from_seq,
        s2.seq AS to_seq,
        s1.departure_min,
        s2.arrival_min,
        s1.departure_formatted,
        s2.arrival_formatted,
        (s2.arrival_min - s1.departure_min) AS duration_min
    FROM trains t
    JOIN train_stops s1 ON s1.train_number = t.train_number AND s1.station_code = p_from
    JOIN train_stops s2 ON s2.train_number = t.train_number AND s2.station_code = p_to
    WHERE s1.seq < s2.seq
    ORDER BY s1.departure_min ASC;
$$;
