-- ============================================
-- 002_auth_triggers.sql
-- Triggers for authentication and auto-updates
-- ============================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schemes_updated_at
  BEFORE UPDATE ON irrigation_schemes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farms_updated_at
  BEFORE UPDATE ON farms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Auto-create profile after auth.signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'farmer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Function to compute national summary (optional)
-- ============================================
CREATE OR REPLACE FUNCTION compute_national_irrigation_summary()
RETURNS national_irrigation_summaries AS $$
DECLARE
  summary national_irrigation_summaries%ROWTYPE;
BEGIN
  INSERT INTO national_irrigation_summaries (
    total_area_under_irrigation_ha,
    total_new_schemes_planned,
    total_new_schemes_operational,
    national_avg_plot_size_ha_per_farmer,
    avg_cost_per_ha,
    water_usage_total_m3,
    created_by
  )
  SELECT
    COALESCE(SUM(f.size_ha), 0),
    COUNT(*) FILTER (WHERE s.status = 'proposed'),
    COUNT(*) FILTER (WHERE s.status = 'operational'),
    (SELECT AVG(total_farm_area) FROM (SELECT SUM(size_ha) AS total_farm_area FROM farms GROUP BY farmer_id) sub),
    AVG(s.cost_per_ha),
    (SELECT SUM(water_volume_m3) FROM water_usage_records WHERE record_date >= date_trunc('month', CURRENT_DATE)),
    auth.uid()
  FROM farms f
  LEFT JOIN irrigation_schemes s ON f.irrigation_scheme_id = s.id
  WHERE f.irrigation_scheme_id IS NOT NULL
  RETURNING * INTO summary;
  RETURN summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;