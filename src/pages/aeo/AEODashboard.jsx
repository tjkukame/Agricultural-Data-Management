import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExportButtons from '../../components/common/ExportButtons';
import { prepareCSVData } from '../../utils/exportUtils.jsx';
import toast from 'react-hot-toast';

export default function AEODashboard() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState({ totalFarmers: 0, totalSchemes: 0, avgYield: 0 });
  const [varietyData, setVarietyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { count: farmers } = await supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'farmer').eq('district', profile.district);
    const { count: schemes } = await supabase.from('irrigation_schemes').select('id', { count: 'exact' }).eq('district', profile.district);
    const { data: yields } = await supabase.from('yield_records').select('yield_kg, farms(size_ha)').eq('farms.district', profile.district);
    let totalYield = 0, totalArea = 0;
    yields?.forEach(y => { totalYield += y.yield_kg; totalArea += y.farms?.size_ha || 0; });
    const avgYield = totalArea ? totalYield / totalArea : 0;
    setSummary({ totalFarmers: farmers || 0, totalSchemes: schemes || 0, avgYield: Math.round(avgYield) });

    // Variety breakdown
    const { data: varietyAgg } = await supabase
      .from('yield_records')
      .select('crop_variety, yield_kg')
      .eq('farms.district', profile.district);
    const varietyMap = new Map();
    varietyAgg?.forEach(v => {
      varietyMap.set(v.crop_variety, (varietyMap.get(v.crop_variety) || 0) + v.yield_kg);
    });
    setVarietyData(Array.from(varietyMap.entries()).map(([name, value]) => ({ name, value })));
    setLoading(false);
  }

  async function addCustomField() {
    if (!newFieldName) return;
    const { error } = await supabase.from('custom_fields').insert({
      field_name: newFieldName,
      field_type: 'text',
      district: profile.district,
      created_by: profile.id
    });
    if (error) toast.error(error.message);
    else toast.success('Custom field added');
    setShowFieldModal(false);
    setNewFieldName('');
  }

  const csvData = prepareCSVData(varietyData, [{ label: 'Variety', key: 'name' }, { label: 'Total Yield (kg)', key: 'value' }]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AEO Dashboard - {profile.district}</h1>
        <button onClick={() => setShowFieldModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded">+ Add Custom Field</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow"><p className="text-gray-500">Total Farmers</p><p className="text-2xl font-bold">{summary.totalFarmers}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-gray-500">Irrigation Schemes</p><p className="text-2xl font-bold">{summary.totalSchemes}</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-gray-500">Avg Yield (kg/ha)</p><p className="text-2xl font-bold">{summary.avgYield}</p></div>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Yield by Variety</h2>
          <ExportButtons csvData={csvData} pdfData={varietyData} pdfTitle="Yield by Variety" filename="aeo_yield" columns={[{ label: 'Variety', key: 'name' }, { label: 'Yield (kg)', key: 'value' }]} />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={varietyData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#10b981" /></BarChart>
        </ResponsiveContainer>
      </div>
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96"><h3 className="text-lg font-bold mb-4">Add Custom Field</h3><input type="text" className="w-full border rounded px-3 py-2 mb-4" placeholder="Field name" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} /><div className="flex justify-end gap-2"><button onClick={() => setShowFieldModal(false)} className="px-4 py-2 border rounded">Cancel</button><button onClick={addCustomField} className="px-4 py-2 bg-purple-600 text-white rounded">Add</button></div></div>
        </div>
      )}
    </div>
  );
}