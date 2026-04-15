import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExportButtons from '../../components/common/ExportButtons';
import { prepareCSVData } from '../../utils/exportUtils.jsx';
import toast from 'react-hot-toast';

export default function SITODashboard() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState({ totalArea: 0, operational: 0, proposed: 0, avgPlot: 0 });
  const [districtData, setDistrictData] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ scheme_name: '', district: '', status: 'proposed', total_area_ha: '', cost_per_ha: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: farms } = await supabase.from('farms').select('size_ha, farmer_id').not('irrigation_scheme_id', 'is', null);
    const totalArea = farms?.reduce((s, f) => s + f.size_ha, 0) || 0;
    const farmerMap = new Map(); farms?.forEach(f => farmerMap.set(f.farmer_id, (farmerMap.get(f.farmer_id) || 0) + f.size_ha));
    const avgPlot = farmerMap.size ? Array.from(farmerMap.values()).reduce((a,b) => a+b,0) / farmerMap.size : 0;
    const { data: allSchemes } = await supabase.from('irrigation_schemes').select('*');
    const operational = allSchemes?.filter(s => s.status === 'operational').length || 0;
    const proposed = allSchemes?.filter(s => s.status === 'proposed').length || 0;
    setSummary({ totalArea, operational, proposed, avgPlot: avgPlot.toFixed(2) });
    // District breakdown
    const districts = [...new Set(allSchemes?.map(s => s.district) || [])];
    const distData = await Promise.all(districts.map(async d => {
      const { data: f } = await supabase.from('farms').select('size_ha').eq('district', d).not('irrigation_scheme_id', 'is', null);
      const area = f?.reduce((s, farm) => s + farm.size_ha, 0) || 0;
      return { district: d, area };
    }));
    setDistrictData(distData);
    setSchemes(allSchemes || []);
    setLoading(false);
  }

  async function addScheme(e) {
    e.preventDefault();
    const { error } = await supabase.from('irrigation_schemes').insert({ ...formData, reported_by: profile.id, reporting_level: 'sito' });
    if (error) toast.error(error.message);
    else { toast.success('Scheme added'); setShowForm(false); fetchData(); }
  }

  const csvDistrict = prepareCSVData(districtData, [{ label: 'District', key: 'district' }, { label: 'Irrigated Area (ha)', key: 'area' }]);
  const csvSchemes = prepareCSVData(schemes, [{ label: 'Scheme', key: 'scheme_name' }, { label: 'District', key: 'district' }, { label: 'Status', key: 'status' }]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">SITO National Dashboard</h1><button onClick={() => setShowForm(true)} className="bg-purple-600 text-white px-4 py-2 rounded">+ Add Large Scheme</button></div>
      <div className="grid grid-cols-4 gap-4 mb-6"><div className="bg-white p-4 rounded shadow"><p>Total Irrigated Area (ha)</p><p className="text-2xl font-bold">{summary.totalArea.toFixed(1)}</p></div><div className="bg-white p-4 rounded shadow"><p>Operational / Proposed</p><p className="text-2xl font-bold">{summary.operational} / {summary.proposed}</p></div><div className="bg-white p-4 rounded shadow"><p>Avg Plot Size (ha)</p><p className="text-2xl font-bold">{summary.avgPlot}</p></div></div>
      <div className="grid grid-cols-2 gap-6 mb-6"><div className="bg-white p-4 rounded shadow"><h2 className="text-lg font-semibold mb-3">District Irrigated Area</h2><ResponsiveContainer width="100%" height={300}><BarChart data={districtData}><XAxis dataKey="district" /><YAxis /><Tooltip /><Bar dataKey="area" fill="#3b82f6" /></BarChart></ResponsiveContainer><ExportButtons csvData={csvDistrict} pdfData={districtData} pdfTitle="District Summary" filename="sito_districts" columns={[{ label: 'District', key: 'district' }, { label: 'Area', key: 'area' }]} /></div>
      <div className="bg-white p-4 rounded shadow"><h2 className="text-lg font-semibold mb-3">All Schemes</h2><ExportButtons csvData={csvSchemes} pdfData={schemes} pdfTitle="All Schemes" filename="sito_schemes" columns={[{ label: 'Scheme', key: 'scheme_name' }, { label: 'District', key: 'district' }, { label: 'Status', key: 'status' }]} /><div className="overflow-auto max-h-96"><table className="min-w-full text-sm"><thead className="bg-gray-100"><tr><th className="border p-2">Scheme</th><th className="border p-2">District</th><th className="border p-2">Status</th></tr></thead><tbody>{schemes.map(s => <tr key={s.id}><td className="border p-2">{s.scheme_name}</td><td className="border p-2">{s.district}</td><td className="border p-2">{s.status}</td></tr>)}</tbody></table></div></div></div>
      {showForm && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><div className="bg-white p-6 rounded w-96"><h3 className="text-lg font-bold mb-4">Add Large Scheme</h3><form onSubmit={addScheme}><input type="text" placeholder="Scheme Name" className="w-full border rounded px-3 py-2 mb-2" onChange={e => setFormData({...formData, scheme_name: e.target.value})} required /><input type="text" placeholder="District" className="w-full border rounded px-3 py-2 mb-2" onChange={e => setFormData({...formData, district: e.target.value})} required /><select className="w-full border rounded px-3 py-2 mb-2" onChange={e => setFormData({...formData, status: e.target.value})}><option value="proposed">Proposed</option><option value="under_construction">Under Construction</option><option value="operational">Operational</option></select><input type="number" step="0.01" placeholder="Total Area (ha)" className="w-full border rounded px-3 py-2 mb-2" onChange={e => setFormData({...formData, total_area_ha: e.target.value})} /><input type="number" step="0.01" placeholder="Cost per ha" className="w-full border rounded px-3 py-2 mb-4" onChange={e => setFormData({...formData, cost_per_ha: e.target.value})} /><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Add</button></div></form></div></div>)}
    </div>
  );
}