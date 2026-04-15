-- ============================================
-- 001_initial_schema.sql
-- Core tables for Agricultural Data System
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM (
  'farmer', 'aa', 'ato_crops', 'ato_irrigation', 'aeo', 'beo', 'dcpo', 'dio', 'sito'
);

CREATE TYPE activity_type AS ENUM (
  'ploughing', 'planting', 'fertilizer', 'irrigation', 'harvest', 'maintenance'
);

CREATE TYPE scheme_status AS ENUM (
  'proposed', 'under_construction', 'operational'
);

CREATE TYPE water_period AS ENUM (
  'daily', 'monthly', 'seasonal'
);

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'farmer',
  district TEXT,
  area TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LOCATION HIERARCHY
-- ============================================
CREATE TABLE principal_chiefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE area_chiefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  principal_chief_id UUID REFERENCES principal_chiefs(id) ON DELETE CASCADE,
  UNIQUE(name, principal_chief_id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE village_chiefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  area_chief_id UUID REFERENCES area_chiefs(id) ON DELETE CASCADE,
  UNIQUE(name, area_chief_id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- IRRIGATION SCHEMES
-- ============================================
CREATE TABLE irrigation_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_name TEXT NOT NULL,
  district TEXT NOT NULL,
  status scheme_status NOT NULL DEFAULT 'proposed',
  total_area_ha NUMERIC CHECK (total_area_ha > 0),
  cost_per_ha NUMERIC CHECK (cost_per_ha >= 0),
  constructed_by TEXT,
  reported_by UUID REFERENCES profiles(id),
  reporting_level TEXT CHECK (reporting_level IN ('dio', 'sito')),
  principal_chief_id UUID REFERENCES principal_chiefs(id),
  area_chief_id UUID REFERENCES area_chiefs(id),
  village_chief_id UUID REFERENCES village_chiefs(id),
  gps_coordinates POINT,
  total_beneficiaries_planned INTEGER,
  large_scheme_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FARMS
-- ============================================
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  irrigation_scheme_id UUID REFERENCES irrigation_schemes(id) ON DELETE SET NULL,
  farm_name TEXT,
  size_ha NUMERIC NOT NULL CHECK (size_ha > 0),
  location TEXT,
  village_chief_id UUID REFERENCES village_chiefs(id),
  gps_coordinates POINT,
  assigned_by_aa_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SCHEME ASSIGNMENTS (AA to Scheme)
-- ============================================
CREATE TABLE scheme_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  irrigation_scheme_id UUID REFERENCES irrigation_schemes(id) ON DELETE CASCADE,
  aa_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(irrigation_scheme_id, aa_id)
);

-- ============================================
-- ACTIVITIES
-- ============================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  activity_date DATE DEFAULT CURRENT_DATE,
  details JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- WATER USAGE RECORDS
-- ============================================
CREATE TABLE water_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  irrigation_scheme_id UUID REFERENCES irrigation_schemes(id) ON DELETE SET NULL,
  record_date DATE NOT NULL,
  period_type water_period NOT NULL,
  water_volume_m3 NUMERIC NOT NULL CHECK (water_volume_m3 >= 0),
  water_source TEXT,
  reported_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MAINTENANCE REPORTS
-- ============================================
CREATE TABLE maintenance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id),
  issue TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'escalated', 'resolved')),
  escalated_to TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- YIELD RECORDS
-- ============================================
CREATE TABLE yield_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  crop_variety TEXT NOT NULL,
  yield_kg NUMERIC NOT NULL CHECK (yield_kg >= 0),
  harvest_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NATIONAL IRRIGATION SUMMARIES
-- ============================================
CREATE TABLE national_irrigation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date DATE DEFAULT CURRENT_DATE,
  total_area_under_irrigation_ha NUMERIC,
  total_new_schemes_planned INTEGER,
  total_new_schemes_operational INTEGER,
  national_avg_plot_size_ha_per_farmer NUMERIC,
  avg_cost_per_ha NUMERIC,
  water_usage_total_m3 NUMERIC,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CUSTOM FIELDS (for AEO)
-- ============================================
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  district TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_district ON profiles(district);
CREATE INDEX idx_schemes_district ON irrigation_schemes(district);
CREATE INDEX idx_schemes_status ON irrigation_schemes(status);
CREATE INDEX idx_farms_farmer ON farms(farmer_id);
CREATE INDEX idx_farms_scheme ON farms(irrigation_scheme_id);
CREATE INDEX idx_activities_farm ON activities(farm_id);
CREATE INDEX idx_activities_type_date ON activities(activity_type, activity_date);
CREATE INDEX idx_water_farm ON water_usage_records(farm_id);
CREATE INDEX idx_water_scheme ON water_usage_records(irrigation_scheme_id);
CREATE INDEX idx_yield_farm ON yield_records(farm_id);
CREATE INDEX idx_maintenance_farm ON maintenance_reports(farm_id);