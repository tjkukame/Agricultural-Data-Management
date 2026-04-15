import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ploughingSchema } from '../../schemas/validationSchemas';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { sanitizeInput } from '../../utils/sanitize';
import toast from 'react-hot-toast';

export default function PloughingForm({ farmId, onSuccess }) {
  const { user } = useAuth();
  const { loading, setLoading, handleError } = useErrorHandler();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ploughingSchema),
    defaultValues: { area_ploughed: '', implement: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const sanitized = sanitizeInput(data);
    const { error } = await supabase.from('activities').insert({
      farm_id: farmId,
      activity_type: 'ploughing',
      details: sanitized,
      created_by: user.id,
    });
    if (error) {
      handleError(error);
      toast.error('Failed to log ploughing');
    } else {
      toast.success('Ploughing logged successfully');
      reset();
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Area ploughed (ha) *</label>
        <input
          type="number"
          step="0.01"
          {...register('area_ploughed', { valueAsNumber: true })}
          className="w-full border rounded px-3 py-2"
          disabled={loading}
        />
        {errors.area_ploughed && (
          <p className="text-red-500 text-sm mt-1">{errors.area_ploughed.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Implement type *</label>
        <select {...register('implement')} className="w-full border rounded px-3 py-2" disabled={loading}>
          <option value="">Select implement</option>
          <option value="tractor">Tractor</option>
          <option value="oxen">Oxen</option>
          <option value="hand">Hand</option>
        </select>
        {errors.implement && <p className="text-red-500 text-sm mt-1">{errors.implement.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}