import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fertilizerSchema } from '../../schemas/validationSchemas';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { sanitizeInput } from '../../utils/sanitize';
import toast from 'react-hot-toast';

export default function FertilizerForm({ farmId, onSuccess }) {
  const { user } = useAuth();
  const { loading, setLoading, handleError } = useErrorHandler();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(fertilizerSchema),
    defaultValues: { fertilizer_type: '', application_rate: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const sanitized = sanitizeInput(data);
    const { error } = await supabase.from('activities').insert({
      farm_id: farmId,
      activity_type: 'fertilizer',
      details: sanitized,
      created_by: user.id,
    });
    if (error) {
      handleError(error);
      toast.error('Failed to log fertilizer application');
    } else {
      toast.success('Fertilizer application logged');
      reset();
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Fertilizer type *</label>
        <input type="text" {...register('fertilizer_type')} className="w-full border rounded px-3 py-2" disabled={loading} />
        {errors.fertilizer_type && <p className="text-red-500 text-sm mt-1">{errors.fertilizer_type.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Application rate (kg/ha) *</label>
        <input type="number" {...register('application_rate', { valueAsNumber: true })} className="w-full border rounded px-3 py-2" disabled={loading} />
        {errors.application_rate && <p className="text-red-500 text-sm mt-1">{errors.application_rate.message}</p>}
      </div>

      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}