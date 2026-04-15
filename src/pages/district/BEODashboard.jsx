import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExportButtons from '../../components/common/ExportButtons';
import { prepareCSVData } from '../../utils/exportUtils.jsx';

export default function BEODashboard() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState({ farmers: 0, schemes: 0, avgYield: 0 });
  const [areaData, setAreaData] = useState([]);
  const [schemeStatus, setSchemeStatus] = useState([]);
  const [loading, setLoading] = useState(true);

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
    setSummary({ farmers: farmers || 0, schemes: schemes || 0, avgYield: totalArea ? Math.round(totalYield / totalArea) : 0 });

    // Group by 'area' (sub-district) if available, otherwise show district-level
    const { data: farmsData } = await supabase.from('farms').select('area, size_ha').eq('district', profile.district);
    if (farmsData && farmsData.length > 0) {
      const areaMap = new Map();
      farmsData.forEach(f => {
        const key = f.area || 'Unassigned';
        areaMap.set(key, (areaMap.get(key) || 0) + f.size_ha);
      });
      setAreaData(Array.from(areaMap.entries()).map(([name, value]) => ({ name, value })));
    } else {
      // Fallback: show a single entry for the district
      const total = farmsData?.reduce((s, f) => s + f.size_ha, 0) || 0;
      setAreaData([{ name: profile.district, value: total }]);
    }

    const { data: statusCount } = await supabase.from('irrigation_schemes').select('status').eq('district', profile.district);
    const statusMap = new Map();
    statusCount?.forEach(s => statusMap.set(s.status, (statusMap.get(s.status) || 0) + 1));
    setSchemeStatus(Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })));
    setLoading(false);
  }

  const csvData = prepareCSVData(areaData, [{ label: 'Area', key: 'name' }, { label: 'Total Area (ha)', key: 'value' }]);
  const COLORS = ['#10b981', '#f59e0b', '#3b82f6'];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">BEO Dashboard - {profile.district}</h1><ExportButtons csvData={csvData} pdfData={areaData} pdfTitle="Area Summary" filename="beo_area" columns={[{ label: 'Area', key: 'name' }, { label: 'Area (ha)', key: 'value' }]} /></div>
      <div className="grid grid-cols-3 gap-4 mb-6"><div className="bg-white p-4 rounded shadow"><p>Farmers</p><p className="text-2xl font-bold">{summary.farmers}</p></div><div className="bg-white p-4 rounded shadow"><p>Schemes</p><p className="text-2xl font-bold">{summary.schemes}</p></div><div className="bg-white p-4 rounded shadow"><p>Avg Yield (kg/ha)</p><p className="text-2xl font-bold">{summary.avgYield}</p></div></div>
      <div className="grid grid-cols-2 gap-6"><div className="bg-white p-4 rounded shadow"><h2 className="text-lg font-semibold mb-3">Area Breakdown (by AA Zone)</h2><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={areaData} dataKey="value" nameKey="name" outerRadius={100} label><Cell fill={COLORS[0]} /></Pie><Tooltip /></PieChart></ResponsiveContainer></div>
      <div className="bg-white p-4 rounded shadow"><h2 className="text-lg font-semibold mb-3">Scheme Status</h2><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={schemeStatus} dataKey="value" nameKey="name" outerRadius={100} label>{schemeStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
    </div>
  );
}