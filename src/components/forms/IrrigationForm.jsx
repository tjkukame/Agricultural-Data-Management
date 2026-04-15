import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { irrigationSchema } from '../../schemas/validationSchemas';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { sanitizeInput } from '../../utils/sanitize';
import toast from 'react-hot-toast';

export default function IrrigationForm({ farmId, onSuccess }) {
  const { user } = useAuth();
  const { loading, setLoading, handleError } = useErrorHandler();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(irrigationSchema),
    defaultValues: { area_irrigated: '', irrigation_type: '', water_volume: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const sanitized = sanitizeInput(data);
    // Insert into activities
    const { error: actError } = await supabase.from('activities').insert({
      farm_id: farmId,
      activity_type: 'irrigation',
      details: sanitized,
      created_by: user.id,
    });
    if (actError) {
      handleError(actError);
      toast.error('Failed to log irrigation');
      setLoading(false);
      return;
    }
    // Also insert into water_usage_records
    const { error: waterError } = await supabase.from('water_usage_records').insert({
      farm_id: farmId,
      record_date: new Date().toISOString().split('T')[0],
      period_type: 'daily',
      water_volume_m3: data.water_volume || 0,
      water_source: data.irrigation_type,
      reported_by: user.id,
    });
    if (waterError) console.warn('Water record insert failed:', waterError);
    toast.success('Irrigation logged successfully');
    reset();
    if (onSuccess) onSuccess();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Area irrigated (ha) *</label>
        <input type="number" step="0.01" {...register('area_irrigated', { valueAsNumber: true })} className="w-full border rounded px-3 py-2" disabled={loading} />
        {errors.area_irrigated && <p className="text-red-500 text-sm mt-1">{errors.area_irrigated.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Irrigation type *</label>
        <select {...register('irrigation_type')} className="w-full border rounded px-3 py-2" disabled={loading}>
          <option value="">Select type</option>
          <option value="drip">Drip</option>
          <option value="sprinkler">Sprinkler</option>
          <option value="furrow">Furrow</option>
        </select>
        {errors.irrigation_type && <p className="text-red-500 text-sm mt-1">{errors.irrigation_type.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Water volume (m³) (optional)</label>
        <input type="number" {...register('water_volume', { valueAsNumber: true })} className="w-full border rounded px-3 py-2" disabled={loading} />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}