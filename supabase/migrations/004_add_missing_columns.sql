-- ============================================
-- 004_add_missing_columns.sql
-- Add district columns for efficient RLS filtering
-- ============================================

-- Add district to farms table
ALTER TABLE farms ADD COLUMN IF NOT EXISTS district TEXT;

-- Update farms.district from linked irrigation scheme
UPDATE farms
SET district = irrigation_schemes.district
FROM irrigation_schemes
WHERE farms.irrigation_scheme_id = irrigation_schemes.id
  AND farms.district IS NULL;

-- Add district to water_usage_records
ALTER TABLE water_usage_records ADD COLUMN IF NOT EXISTS district TEXT;

-- Update water_usage_records.district from linked farm
UPDATE water_usage_records
SET district = farms.district
FROM farms
WHERE water_usage_records.farm_id = farms.id
  AND water_usage_records.district IS NULL;

-- Create triggers to keep district in sync (optional)
CREATE OR REPLACE FUNCTION update_farms_district()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.irrigation_scheme_id IS NOT NULL THEN
    SELECT district INTO NEW.district
    FROM irrigation_schemes
    WHERE id = NEW.irrigation_scheme_id;
  ELSE
    NEW.district = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_farms_district ON farms;
CREATE TRIGGER trg_update_farms_district
  BEFORE INSERT OR UPDATE OF irrigation_scheme_id ON farms
  FOR EACH ROW EXECUTE FUNCTION update_farms_district();

CREATE OR REPLACE FUNCTION update_water_district()
RETURNS TRIGGER AS $$
BEGIN
  SELECT district INTO NEW.district
  FROM farms
  WHERE id = NEW.farm_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_water_district ON water_usage_records;
CREATE TRIGGER trg_update_water_district
  BEFORE INSERT OR UPDATE OF farm_id ON water_usage_records
  FOR EACH ROW EXECUTE FUNCTION update_water_district();

-- Add area column to farms (for AA zones) – optional but used in BEO dashboard
ALTER TABLE farms ADD COLUMN IF NOT EXISTS area TEXT;