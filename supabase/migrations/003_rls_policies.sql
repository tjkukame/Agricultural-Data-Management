-- ============================================
-- 003_rls_policies.sql
-- Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE principal_chiefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_chiefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_chiefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE yield_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE national_irrigation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- LOCATION (read-only for all authenticated)
-- ============================================
CREATE POLICY "Read all chiefs" ON principal_chiefs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read all area chiefs" ON area_chiefs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read all village chiefs" ON village_chiefs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "SITO manage chiefs" ON principal_chiefs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'sito')
);

-- ============================================
-- IRRIGATION SCHEMES
-- ============================================
CREATE POLICY "DIO manage own district schemes" ON irrigation_schemes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'dio' AND district = irrigation_schemes.district
    )
  );

CREATE POLICY "SITO full access schemes" ON irrigation_schemes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'sito')
  );

CREATE POLICY "Area staff view schemes" ON irrigation_schemes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('ato_irrigation', 'aeo', 'aa')
      AND (p.district = irrigation_schemes.district OR p.area = irrigation_schemes.district)
    )
  );

CREATE POLICY "Farmers view own scheme" ON irrigation_schemes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM farms f
      WHERE f.farmer_id = auth.uid() AND f.irrigation_scheme_id = irrigation_schemes.id
    )
  );

-- ============================================
-- FARMS
-- ============================================
CREATE POLICY "Farmer owns farm" ON farms
  FOR ALL USING (auth.uid() = farmer_id);

CREATE POLICY "AA manages farms in assigned schemes" ON farms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM scheme_assignments sa
      WHERE sa.aa_id = auth.uid() AND sa.irrigation_scheme_id = farms.irrigation_scheme_id
    )
  );

CREATE POLICY "ATO view district farms" ON farms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN irrigation_schemes s ON s.district = p.district
      WHERE p.id = auth.uid() AND p.role = 'ato_irrigation' AND s.id = farms.irrigation_scheme_id
    )
  );

CREATE POLICY "DIO view district farms" ON farms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'dio' AND district = (SELECT district FROM irrigation_schemes WHERE id = farms.irrigation_scheme_id)
    )
  );

CREATE POLICY "SITO view all farms" ON farms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'sito')
  );

-- ============================================
-- SCHEME ASSIGNMENTS
-- ============================================
CREATE POLICY "ATO DIO SITO manage assignments" ON scheme_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ato_irrigation', 'dio', 'sito'))
  );

CREATE POLICY "AA view own assignments" ON scheme_assignments
  FOR SELECT USING (auth.uid() = aa_id);

-- ============================================
-- ACTIVITIES
-- ============================================
CREATE POLICY "Farmer CRUD own activities" ON activities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = activities.farm_id AND farms.farmer_id = auth.uid())
  );

CREATE POLICY "AA manage activities assigned schemes" ON activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM farms f
      JOIN scheme_assignments sa ON sa.irrigation_scheme_id = f.irrigation_scheme_id
      WHERE f.id = activities.farm_id AND sa.aa_id = auth.uid()
    )
  );

CREATE POLICY "Staff view activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('ato_crops', 'ato_irrigation', 'aeo', 'beo', 'dcpo', 'dio', 'sito')
    )
  );

-- ============================================
-- WATER USAGE RECORDS
-- ============================================
CREATE POLICY "Farmer CRUD own water usage" ON water_usage_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = water_usage_records.farm_id AND farms.farmer_id = auth.uid())
  );

CREATE POLICY "AA manage water usage assigned schemes" ON water_usage_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM farms f
      JOIN scheme_assignments sa ON sa.irrigation_scheme_id = f.irrigation_scheme_id
      WHERE f.id = water_usage_records.farm_id AND sa.aa_id = auth.uid()
    )
  );

CREATE POLICY "Staff view water usage" ON water_usage_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('ato_irrigation', 'aeo', 'dio', 'sito')
    )
  );

-- ============================================
-- MAINTENANCE REPORTS
-- ============================================
CREATE POLICY "Farmer report maintenance" ON maintenance_reports
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = maintenance_reports.farm_id AND farms.farmer_id = auth.uid())
  );

CREATE POLICY "AA manage maintenance" ON maintenance_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM farms f
      JOIN scheme_assignments sa ON sa.irrigation_scheme_id = f.irrigation_scheme_id
      WHERE f.id = maintenance_reports.farm_id AND sa.aa_id = auth.uid()
    )
  );

CREATE POLICY "Staff view maintenance" ON maintenance_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ato_irrigation', 'aeo', 'dio', 'sito'))
  );

-- ============================================
-- YIELD RECORDS
-- ============================================
CREATE POLICY "Farmer CRUD yield" ON yield_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM farms WHERE farms.id = yield_records.farm_id AND farms.farmer_id = auth.uid())
  );

CREATE POLICY "AA manage yield assigned schemes" ON yield_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM farms f
      JOIN scheme_assignments sa ON sa.irrigation_scheme_id = f.irrigation_scheme_id
      WHERE f.id = yield_records.farm_id AND sa.aa_id = auth.uid()
    )
  );

CREATE POLICY "Staff view yield" ON yield_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ato_crops', 'aeo', 'beo', 'dcpo', 'sito'))
  );

-- ============================================
-- NATIONAL SUMMARIES
-- ============================================
CREATE POLICY "SITO manage national summaries" ON national_irrigation_summaries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'sito')
  );

CREATE POLICY "All authenticated view summaries" ON national_irrigation_summaries
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- CUSTOM FIELDS
-- ============================================
CREATE POLICY "AEO manage custom fields" ON custom_fields
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'aeo')
  );

CREATE POLICY "Staff view custom fields" ON custom_fields
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('aeo', 'beo', 'dcpo', 'dio', 'sito'))
  );