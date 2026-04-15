import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import toast from 'react-hot-toast';

export default function AssignAAModal({ scheme, onClose, onAssigned }) {
  const { profile } = useAuth();
  const [aaList, setAaList] = useState([]);
  const [selectedAaId, setSelectedAaId] = useState('');
  const { loading, setLoading, handleError } = useErrorHandler();

  useEffect(() => {
    async function fetchAAs() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, area')
        .eq('role', 'aa')
        .eq('district', scheme.district);
      if (error) {
        handleError(error);
      } else {
        setAaList(data);
      }
    }
    if (scheme) fetchAAs();
  }, [scheme, handleError]);

  const handleAssign = async () => {
    if (!selectedAaId) {
      toast.error('Please select an AA');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('scheme_assignments').insert({
      irrigation_scheme_id: scheme.id,
      aa_id: selectedAaId,
      assigned_by: profile.id,
    });
    if (error) {
      if (error.code === '23505') {
        toast.error('This AA is already assigned to the scheme');
      } else {
        handleError(error);
      }
    } else {
      toast.success('AA assigned successfully');
      if (onAssigned) onAssigned();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Assign AA to Scheme</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
            &times;
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Scheme: <span className="font-semibold">{scheme.scheme_name}</span>
          </p>
          <p className="text-sm text-gray-600 mb-4">District: {scheme.district}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Area Assistant</label>
          <select
            value={selectedAaId}
            onChange={(e) => setSelectedAaId(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">-- Choose AA --</option>
            {aaList.map((aa) => (
              <option key={aa.id} value={aa.id}>
                {aa.full_name} {aa.area ? `(${aa.area})` : ''}
              </option>
            ))}
          </select>
          {aaList.length === 0 && !loading && (
            <p className="text-sm text-amber-600 mt-1">No AAs found in this district.</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedAaId}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}