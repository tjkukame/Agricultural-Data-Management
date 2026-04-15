import { z } from 'zod';

// Activity schemas
export const ploughingSchema = z.object({
  area_ploughed: z.number({ required_error: 'Area is required', invalid_type_error: 'Must be a number' })
    .positive('Area must be positive')
    .min(0.01, 'Minimum area is 0.01 ha'),
  implement: z.string().min(1, 'Implement type is required')
});

export const plantingSchema = z.object({
  seed_name: z.string().min(1, 'Seed name is required'),
  variety: z.string().min(1, 'Variety is required'),
  plant_density: z.number().positive().optional(),
  area_seeded: z.number({ required_error: 'Area is required' })
    .positive('Area must be positive')
    .min(0.01, 'Minimum area is 0.01 ha')
});

export const fertilizerSchema = z.object({
  fertilizer_type: z.string().min(1, 'Fertilizer type is required'),
  application_rate: z.number({ required_error: 'Rate is required' })
    .positive('Rate must be positive')
});

export const irrigationSchema = z.object({
  area_irrigated: z.number({ required_error: 'Area is required' })
    .positive('Area must be positive')
    .min(0.01, 'Minimum area is 0.01 ha'),
  irrigation_type: z.enum(['drip', 'sprinkler', 'furrow'], {
    required_error: 'Irrigation type is required'
  }),
  water_volume: z.number().nonnegative().optional()
});

export const harvestSchema = z.object({
  crop_variety: z.string().min(1, 'Crop variety is required'),
  yield_kg: z.number({ required_error: 'Yield is required' })
    .positive('Yield must be positive'),
  harvest_date: z.string().min(1, 'Harvest date is required').date('Valid date required')
});

export const maintenanceSchema = z.object({
  issue: z.string().min(5, 'Please describe the issue (minimum 5 characters)')
});

// Farm schema
export const farmSchema = z.object({
  farm_name: z.string().min(1, 'Farm name is required'),
  size_ha: z.number({ required_error: 'Size is required' })
    .positive('Size must be positive')
    .min(0.01, 'Minimum size is 0.01 ha'),
  location: z.string().optional(),
  village_chief_id: z.string().uuid('Invalid village chief').optional()
});

// Scheme schema (for SITO/DIO)
export const schemeSchema = z.object({
  scheme_name: z.string().min(1, 'Scheme name is required'),
  district: z.string().min(1, 'District is required'),
  status: z.enum(['proposed', 'under_construction', 'operational']),
  total_area_ha: z.number().positive().optional(),
  cost_per_ha: z.number().nonnegative().optional(),
  constructed_by: z.string().optional(),
  principal_chief_id: z.string().uuid().optional(),
  area_chief_id: z.string().uuid().optional(),
  village_chief_id: z.string().uuid().optional(),
  large_scheme_details: z.record(z.any()).optional()
});

// User registration schema
export const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});