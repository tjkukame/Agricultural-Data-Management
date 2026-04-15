import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { maintenanceSchema } from '../../schemas/validationSchemas';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { sanitizeInput } from '../../utils/sanitize';
import toast from 'react-hot-toast';

export default function MaintenanceForm({ farmId, onSuccess }) {
  const { user } = useAuth();
  const { loading, setLoading, handleError } = useErrorHandler();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { issue: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const sanitized = sanitizeInput(data);
    const { error } = await supabase.from('maintenance_reports').insert({
      farm_id: farmId,
      reported_by: user.id,
      issue: sanitized.issue,
      status: 'pending',
      escalated_to: 'AA',
    });
    if (error) {
      handleError(error);
      toast.error('Failed to report maintenance issue');
    } else {
      toast.success('Maintenance reported successfully');
      reset();
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Describe the issue *</label>
        <textarea
          {...register('issue')}
          rows="3"
          className="w-full border rounded px-3 py-2"
          placeholder="e.g., Pump not working, pipe leak, electrical fault..."
          disabled={loading}
        />
        {errors.issue && <p className="text-red-500 text-sm mt-1">{errors.issue.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Report Issue'}
      </button>
    </form>
  );
}