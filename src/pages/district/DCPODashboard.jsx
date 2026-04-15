import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExportButtons from '../../components/common/ExportButtons';
import { prepareCSVData } from '../../utils/exportUtils.jsx';

export default function DCPODashboard() {
  const { profile } = useAuth();
  const [varietyPerf, setVarietyPerf] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: yields } = await supabase.from('yield_records').select('crop_variety, yield_kg, harvest_date, farms(irrigation_scheme_id)').eq('farms.district', profile.district);
    if (yields) {
      const perfMap = new Map();
      yields.forEach(y => {
        const variety = y.crop_variety;
        const isIrrigated = y.farms?.irrigation_scheme_id !== null;
        if (!perfMap.has(variety)) perfMap.set(variety, { variety, irrigated: 0, rainfed: 0, count: 0 });
        const entry = perfMap.get(variety);
        if (isIrrigated) entry.irrigated += y.yield_kg;
        else entry.rainfed += y.yield_kg;
        entry.count++;
      });
      setVarietyPerf(Array.from(perfMap.values()).map(p => ({ variety: p.variety, irrigatedAvg: p.count ? (p.irrigated / p.count).toFixed(0) : 0, rainfedAvg: p.count ? (p.rainfed / p.count).toFixed(0) : 0 })));
    }
    // Simple trend by year
    const { data: yearly } = await supabase.from('yield_records').select('harvest_date, yield_kg').eq('farms.district', profile.district);
    const yearlyMap = new Map();
    yearly?.forEach(y => { const year = new Date(y.harvest_date).getFullYear(); yearlyMap.set(year, (yearlyMap.get(year) || 0) + y.yield_kg); });
    setTrend(Array.from(yearlyMap.entries()).map(([year, total]) => ({ year, total })));
    setLoading(false);
  }

  const csvData = prepareCSVData(varietyPerf, [{ label: 'Variety', key: 'variety' }, { label: 'Irrigated Avg (kg)', key: 'irrigatedAvg' }, { label: 'Rainfed Avg (kg)', key: 'rainfedAvg' }]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">DCPO - {profile.district}</h1><ExportButtons csvData={csvData} pdfData={varietyPerf} pdfTitle="Crop Performance" filename="dcpo_crops" columns={[{ label: 'Variety', key: 'variety' }, { label: 'Irrigated', key: 'irrigatedAvg' }, { label: 'Rainfed', key: 'rainfedAvg' }]} /></div>
      <div className="bg-white p-4 rounded shadow mb-6"><h2 className="text-lg font-semibold mb-3">Variety Performance</h2><ResponsiveContainer width="100%" height={400}><BarChart data={varietyPerf}><XAxis dataKey="variety" /><YAxis /><Tooltip /><Bar dataKey="irrigatedAvg" fill="#3b82f6" name="Irrigated" /><Bar dataKey="rainfedAvg" fill="#10b981" name="Rainfed" /></BarChart></ResponsiveContainer></div>
      <div className="bg-white p-4 rounded shadow"><h2 className="text-lg font-semibold mb-3">Yield Trend (Yearly)</h2><ResponsiveContainer width="100%" height={300}><LineChart data={trend}><XAxis dataKey="year" /><YAxis /><Tooltip /><Line type="monotone" dataKey="total" stroke="#f59e0b" /></LineChart></ResponsiveContainer></div>
    </div>
  );
}