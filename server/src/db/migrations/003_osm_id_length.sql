-- Phase 2: Widen roads/settlements IDs to support OSM identifiers (osm_w123456789)

ALTER TABLE roads ALTER COLUMN id TYPE VARCHAR(50);
ALTER TABLE settlements ALTER COLUMN id TYPE VARCHAR(50);
