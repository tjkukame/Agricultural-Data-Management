-- ============================================
-- seed_data.sql
-- Sample data for testing
-- ============================================

-- Insert sample principal chiefs
INSERT INTO principal_chiefs (name) VALUES 
  ('Chief Moshoshoe'),
  ('Chief Maseru'),
  ('Chief Leribe');

-- Insert sample area chiefs
INSERT INTO area_chiefs (name, principal_chief_id) VALUES 
  ('Mohlakeng', (SELECT id FROM principal_chiefs WHERE name='Chief Moshoshoe')),
  ('Ha Abia', (SELECT id FROM principal_chiefs WHERE name='Chief Moshoshoe')),
  ('Mabote', (SELECT id FROM principal_chiefs WHERE name='Chief Maseru'));

-- Insert sample village chiefs
INSERT INTO village_chiefs (name, area_chief_id) VALUES 
  ('Ha Tšosane', (SELECT id FROM area_chiefs WHERE name='Mohlakeng')),
  ('Ha Ntširele', (SELECT id FROM area_chiefs WHERE name='Mohlakeng')),
  ('Ha Majara', (SELECT id FROM area_chiefs WHERE name='Ha Abia'));

-- Insert sample irrigation schemes (will be created by DIO or SITO later)
-- Note: These require district values that match your actual districts
INSERT INTO irrigation_schemes (scheme_name, district, status, total_area_ha, cost_per_ha, constructed_by, reporting_level)
VALUES 
  ('Mohlakeng Valley Scheme', 'Maseru', 'operational', 150.5, 2500, 'Government', 'dio'),
  ('Ha Tšosane Smallholder', 'Maseru', 'proposed', 45.0, 3200, 'NGO', 'dio'),
  ('Leribe River Scheme', 'Leribe', 'under_construction', 200.0, 2800, 'Government', 'sito');

-- Insert a sample AA user (you need to create auth user first, then update profile)
-- This is just a template – actual user creation should be done via auth.signUp
-- UPDATE profiles SET role = 'aa', district = 'Maseru', area = 'Mohlakeng' WHERE id = 'user-uuid-here';