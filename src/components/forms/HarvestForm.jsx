import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { harvestSchema } from '../../schemas/validationSchemas';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { sanitizeInput } from '../../utils/sanitize';
import toast from 'react-hot-toast';

export default function HarvestForm({ farmId, onSuccess }) {
  const { user } = useAuth();
  const { loading, setLoading, handleError } = useErrorHandler();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(harvestSchema),
    defaultValues: { crop_variety: '', yield_kg: '', harvest_date: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const sanitized = sanitizeInput(data);
    // Insert into yield_records
    const { error: yieldError } = await supabase.from('yield_records').insert({
      farm_id: farmId,
      crop_variety: sanitized.crop_variety,
      yield_kg: sanitized.yield_kg,
      harvest_date: sanitized.harvest_date,
    });
    if (yieldError) {
      handleError(yieldError);
      toast.error('Failed to log harvest');
    } else {
      // Also log as activity
      await supabase.from('activities').insert({
        farm_id: farmId,
        activity_type: 'harvest',
        details: sanitized,
        created_by: user.id,
      });
      toast.success('Harvest logged successfully');
      reset();
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Crop variety *</label>
        <input type="text" {...register('crop_variety')} className="w-full border rounded px-3 py-2" disabled={loading} />
        {errors.crop_variety && <p className="text-red-500 text-sm mt-1">{errors.crop_variety.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Yield (kg) *</label>
        <input type="number" {...register('yield_kg', { valueAsNumber: true })} className="w-full border rounded px-3 py-2" disabled={loading} />
        {errors.yield_kg && <p className="text-red-500 text-sm mt-1">{errors.yield_kg.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Harvest date *</label>
        <input type="date" {...register('harvest_date')} className="w-full border rounded px-3 py-2" disabled={loading} />
        {errors.harvest_date && <p className="text-red-500 text-sm mt-1">{errors.harvest_date.message}</p>}
      </div>

      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}