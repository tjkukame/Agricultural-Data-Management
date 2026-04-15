import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Combined schema for onboarding
const onboardingSchema = z.object({
  farmer_name: z.string().min(1, 'Farmer name required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  farm_name: z.string().min(1, 'Farm name required'),
  size_ha: z.number().positive().min(0.01),
  location: z.string().optional(),
  scheme_id: z.string().uuid('Scheme required'),
  village_chief_id: z.string().uuid().optional(),
});

export default function AAOnboarding() {
  const { profile } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { farmer_name: '', email: '', farm_name: '', size_ha: '', location: '', scheme_id: '', village_chief_id: '' }
  });

  useEffect(() => {
    async function fetchSchemes() {
      const { data } = await supabase
        .from('scheme_assignments')
        .select('irrigation_scheme_id, irrigation_schemes(*)')
        .eq('aa_id', profile.id);
      if (data) setSchemes(data.map(item => item.irrigation_schemes));
    }
    async function fetchVillages() {
      const { data } = await supabase.from('village_chiefs').select('id, name');
      if (data) setVillages(data);
    }
    fetchSchemes();
    fetchVillages();
  }, [profile.id]);

const onSubmit = async (data) => {
  setLoading(true);
  
  // Validate farmer_name exists
  if (!data.farmer_name || data.farmer_name.trim() === '') {
    toast.error('Farmer name is required');
    setLoading(false);
    return;
  }

  // Generate safe email
  let farmerEmail = data.email;
  if (!farmerEmail || farmerEmail.trim() === '') {
    const sanitizedName = data.farmer_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now();
    farmerEmail = `${sanitizedName}${timestamp}@temp.agri.com`;
  }

  // Generate secure password (at least 8 chars, alphanumeric)
  const tempPassword = Math.random().toString(36).slice(-10) + 'A1'; // ensures length and includes uppercase/number
  
  // Validate email format before signup
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(farmerEmail)) {
    toast.error('Generated email is invalid. Please provide a valid email.');
    setLoading(false);
    return;
  }

  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: farmerEmail,
      password: tempPassword,
      options: { data: { full_name: data.farmer_name } }
    });
    if (signUpError) throw signUpError;
    
    const farmerId = authData.user.id;
    const selectedScheme = schemes.find(s => s.id === data.scheme_id);
    
    const { error: farmError } = await supabase.from('farms').insert({
      farmer_id: farmerId,
      irrigation_scheme_id: data.scheme_id,
      farm_name: data.farm_name,
      size_ha: data.size_ha,
      location: data.location,
      village_chief_id: data.village_chief_id,
      assigned_by_aa_id: profile.id,
      district: selectedScheme?.district,
      area: profile.area
    });
    
    if (farmError) throw farmError;
    
    toast.success(`Farmer ${data.farmer_name} onboarded! Temporary password: ${tempPassword} (save this or send to farmer)`);
    reset();
  } catch (err) {
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Onboard New Farmer</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label>Farmer Name *</label>
          <input {...register('farmer_name')} className="w-full border rounded px-3 py-2" />
          {errors.farmer_name && <p className="text-red-500 text-sm">{errors.farmer_name.message}</p>}
        </div>
        <div>
          <label>Email (optional, auto-generated if empty)</label>
          <input type="email" {...register('email')} className="w-full border rounded px-3 py-2" />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>
        <div>
          <label>Irrigation Scheme *</label>
          <select {...register('scheme_id')} className="w-full border rounded px-3 py-2">
            <option value="">Select scheme</option>
            {schemes.map(s => <option key={s.id} value={s.id}>{s.scheme_name}</option>)}
          </select>
          {errors.scheme_id && <p className="text-red-500 text-sm">{errors.scheme_id.message}</p>}
        </div>
        <div>
          <label>Farm Name *</label>
          <input {...register('farm_name')} className="w-full border rounded px-3 py-2" />
          {errors.farm_name && <p className="text-red-500 text-sm">{errors.farm_name.message}</p>}
        </div>
        <div>
          <label>Size (ha) *</label>
          <input type="number" step="0.01" {...register('size_ha', { valueAsNumber: true })} className="w-full border rounded px-3 py-2" />
          {errors.size_ha && <p className="text-red-500 text-sm">{errors.size_ha.message}</p>}
        </div>
        <div>
          <label>Location</label>
          <input {...register('location')} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label>Village Chief</label>
          <select {...register('village_chief_id')} className="w-full border rounded px-3 py-2">
            <option value="">Select village</option>
            {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded">Onboard Farmer</button>
      </form>
    </div>
  );
}