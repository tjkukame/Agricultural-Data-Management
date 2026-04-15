import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExportButtons from '../../components/common/ExportButtons';
import { prepareCSVData } from '../../utils/exportUtils.jsx';

export default function ATOCropsDashboard() {
  const { profile } = useAuth();
  const [yieldData, setYieldData] = useState([]);
  const [varietyPerformance, setVarietyPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // Get all yield records in district
    const { data } = await supabase
      .from('yield_records')
      .select(`
        crop_variety,
        yield_kg,
        harvest_date,
        farms ( irrigation_scheme_id, size_ha )
      `)
      .eq('farms.district', profile.district);
    if (data) {
      setYieldData(data);
      // Aggregate by variety
      const perfMap = new Map();
      data.forEach(rec => {
        const variety = rec.crop_variety;
        const isIrrigated = rec.farms?.irrigation_scheme_id !== null;
        if (!perfMap.has(variety)) perfMap.set(variety, { variety, irrigated: 0, rainfed: 0, count: 0 });
        const entry = perfMap.get(variety);
        if (isIrrigated) entry.irrigated += rec.yield_kg;
        else entry.rainfed += rec.yield_kg;
        entry.count++;
      });
      const perf = Array.from(perfMap.values()).map(p => ({
        variety: p.variety,
        irrigatedAvg: p.count ? (p.irrigated / p.count).toFixed(0) : 0,
        rainfedAvg: p.count ? (p.rainfed / p.count).toFixed(0) : 0,
      }));
      setVarietyPerformance(perf);
    }
    setLoading(false);
  }

  const csvData = prepareCSVData(varietyPerformance, [
    { label: 'Variety', key: 'variety' },
    { label: 'Irrigated Avg (kg)', key: 'irrigatedAvg' },
    { label: 'Rainfed Avg (kg)', key: 'rainfedAvg' },
  ]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ATO Crops - {profile.district}</h1>
        <ExportButtons csvData={csvData} pdfData={varietyPerformance} pdfTitle="Crop Performance" filename="crop_performance" columns={[{ label: 'Variety', key: 'variety' }, { label: 'Irrigated Avg', key: 'irrigatedAvg' }, { label: 'Rainfed Avg', key: 'rainfedAvg' }]} />
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Variety Performance: Irrigated vs Rainfed</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={varietyPerformance}>
            <XAxis dataKey="variety" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="irrigatedAvg" fill="#3b82f6" name="Irrigated" />
            <Bar dataKey="rainfedAvg" fill="#10b981" name="Rainfed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}