import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { plantingSchema } from '../../schemas/validationSchemas';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { sanitizeInput } from '../../utils/sanitize';
import toast from 'react-hot-toast';

export default function PlantingForm({ farmId, onSuccess }) {
  const { user } = useAuth();
  const { loading, setLoading, handleError } = useErrorHandler();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(plantingSchema),
    defaultValues: { seed_name: '', variety: '', plant_density: '', area_seeded: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const sanitized = sanitizeInput(data);
    const { error } = await supabase.from('activities').insert({
      farm_id: farmId,
      activity_type: 'planting',
      details: sanitized,
      created_by: user.id,
    });
    if (error) {
      handleError(error);
      toast.error('Failed to log planting');
    } else {
      toast.success('Planting logged successfully');
      reset();
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Seed name *</label>
        <input type="text" {...register('seed_name')} className="w-full border rounded px-3 py-2" disabled={loading} />
        {errors.seed_name && <p className="text-red-500 text-sm mt-1">{errors.seed_name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Variety *</label>
        <input type="text" {...register('variety')} className="w-full border rounded px-3 py-2" disabled={loading} />
        {errors.variety && <p className="text-red-500 text-sm mt-1">{errors.variety.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Plant density (plants/ha)</label>
        <input type="number" {...register('plant_density', { valueAsNumber: true })} className="w-full border rounded px-3 py-2" disabled={loading} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Area seeded (ha) *</label>
        <input type="number" step="0.01" {...register('area_seeded', { valueAsNumber: true })} className="w-full border rounded px-3 py-2" disabled={loading} />
        {errors.area_seeded && <p className="text-red-500 text-sm mt-1">{errors.area_seeded.message}</p>}
      </div>

      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}