-- ==============================================================================
-- 0002_unified_datalayer_tables.sql
-- TravelRescue AI: Unified Supabase Data Layer
-- Adds: missing station/train metadata, routes, schedules, disruptions,
--       trips, sim_scenarios, sim_events, advisories + RLS policies
-- ==============================================================================

-- 1. EXTEND STATIONS WITH FACILITIES, PLATFORMS, AND ACCESSIBILITY
ALTER TABLE stations 
    ADD COLUMN IF NOT EXISTS facilities JSONB NOT NULL DEFAULT '["waiting_hall", "water", "tea_stall"]'::jsonb,
    ADD COLUMN IF NOT EXISTS platforms INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS accessibility JSONB NOT NULL DEFAULT '{"wheelchair": true, "ramp": true}'::jsonb;

-- 2. EXTEND TRAINS WITH CAPACITY AND AMENITIES
ALTER TABLE trains
    ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 1200,
    ADD COLUMN IF NOT EXISTS amenities JSONB NOT NULL DEFAULT '{"pantry": true, "charging_sockets": true, "bio_toilets": true}'::jsonb;

-- 3. ROUTES TABLE
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    from_station VARCHAR(10) NOT NULL REFERENCES stations(code) ON DELETE RESTRICT,
    to_station VARCHAR(10) NOT NULL REFERENCES stations(code) ON DELETE RESTRICT,
    distance_km NUMERIC(7,1) NOT NULL,
    avg_duration_min INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_route_stations_distinct CHECK (from_station <> to_station),
    CONSTRAINT ck_route_dist_pos CHECK (distance_km > 0),
    CONSTRAINT ck_route_duration_pos CHECK (avg_duration_min > 0)
);

CREATE INDEX IF NOT EXISTS idx_routes_from_to ON routes (from_station, to_station);

-- 4. SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    train_number VARCHAR(10) NOT NULL REFERENCES trains(train_number) ON DELETE CASCADE,
    departure_time VARCHAR(20) NOT NULL,
    arrival_time VARCHAR(20) NOT NULL,
    days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
    platform VARCHAR(10) NOT NULL DEFAULT '1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_train ON schedules (train_number);
CREATE INDEX IF NOT EXISTS idx_schedules_route ON schedules (route_id);

-- 5. DISRUPTIONS TABLE
CREATE TABLE IF NOT EXISTS disruptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    station_code VARCHAR(10) REFERENCES stations(code) ON DELETE SET NULL,
    type VARCHAR(60) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'CRITICAL', 'FATAL')),
    description TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    source VARCHAR(20) NOT NULL DEFAULT 'sim' CHECK (source IN ('sim', 'manual', 'external')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disruptions_severity ON disruptions (severity);
CREATE INDEX IF NOT EXISTS idx_disruptions_source ON disruptions (source);
CREATE INDEX IF NOT EXISTS idx_disruptions_started ON disruptions (started_at DESC);

-- 6. TRIPS TABLE
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    passenger_id TEXT NOT NULL DEFAULT 'usr_default',
    passenger_name TEXT NOT NULL DEFAULT 'Passenger',
    train_number VARCHAR(10) NOT NULL REFERENCES trains(train_number) ON DELETE RESTRICT,
    from_station_code VARCHAR(10) NOT NULL REFERENCES stations(code) ON DELETE RESTRICT,
    to_station_code VARCHAR(10) NOT NULL REFERENCES stations(code) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'DELAYED', 'CANCELLED', 'REBOOKED', 'COMPLETED')),
    pnr VARCHAR(20),
    seat_info JSONB NOT NULL DEFAULT '{"coach": "B1", "berth": "32", "class": "3A"}'::jsonb,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    disruption_id UUID REFERENCES disruptions(id) ON DELETE SET NULL,
    booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_passenger ON trips (passenger_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips (status);
CREATE INDEX IF NOT EXISTS idx_trips_train ON trips (train_number);

-- 7. SIM SCENARIOS TABLE
CREATE TABLE IF NOT EXISTS sim_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    created_by TEXT NOT NULL DEFAULT 'dispatcher',
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    train_number VARCHAR(10) REFERENCES trains(train_number) ON DELETE SET NULL,
    initial_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    obstacles JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sim_scenarios_train ON sim_scenarios (train_number);

-- 8. SIM EVENTS TABLE
CREATE TABLE IF NOT EXISTS sim_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES sim_scenarios(id) ON DELETE CASCADE,
    t_offset_ms BIGINT NOT NULL DEFAULT 0,
    kind VARCHAR(60) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sim_events_scenario ON sim_events (scenario_id, t_offset_ms);

-- 9. ADVISORIES TABLE
CREATE TABLE IF NOT EXISTS advisories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES sim_scenarios(id) ON DELETE CASCADE,
    recommended_action JSONB NOT NULL DEFAULT '{}'::jsonb,
    rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisories_scenario ON advisories (scenario_id);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisories ENABLE ROW LEVEL SECURITY;

-- Routes: Public catalog read access
CREATE POLICY "Allow public read access to routes"
    ON routes FOR SELECT
    TO anon, authenticated
    USING (true);

-- Schedules: Public catalog read access
CREATE POLICY "Allow public read access to schedules"
    ON schedules FOR SELECT
    TO anon, authenticated
    USING (true);

-- Disruptions: Public read access
CREATE POLICY "Allow public read access to disruptions"
    ON disruptions FOR SELECT
    TO anon, authenticated
    USING (true);

-- Disruptions: Authenticated and simulator inserts/updates
CREATE POLICY "Allow insert access to disruptions"
    ON disruptions FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

CREATE POLICY "Allow update access to disruptions"
    ON disruptions FOR UPDATE
    TO anon, authenticated, service_role
    USING (true);

-- Trips: Users read trips (anon + authenticated)
CREATE POLICY "Allow read access to trips"
    ON trips FOR SELECT
    TO anon, authenticated
    USING (true);

-- Trips: Booking / rebooking inserts and updates
CREATE POLICY "Allow insert access to trips"
    ON trips FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

CREATE POLICY "Allow update access to trips"
    ON trips FOR UPDATE
    TO anon, authenticated, service_role
    USING (true);

-- Sim Scenarios: Public read + write for dispatcher simulation
CREATE POLICY "Allow read access to sim_scenarios"
    ON sim_scenarios FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert access to sim_scenarios"
    ON sim_scenarios FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

CREATE POLICY "Allow update access to sim_scenarios"
    ON sim_scenarios FOR UPDATE
    TO anon, authenticated, service_role
    USING (true);

-- Sim Events: Scenario event logging
CREATE POLICY "Allow read access to sim_events"
    ON sim_events FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert access to sim_events"
    ON sim_events FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

-- Advisories: Recommendations logged by AI advisor
CREATE POLICY "Allow read access to advisories"
    ON advisories FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert access to advisories"
    ON advisories FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);
