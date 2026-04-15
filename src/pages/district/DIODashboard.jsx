import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExportButtons from '../../components/common/ExportButtons';
import { prepareCSVData } from '../../utils/exportUtils.jsx';
import toast from 'react-hot-toast';

export default function DIODashboard() {
  const { profile } = useAuth();
  const [waterTrend, setWaterTrend] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: water } = await supabase.from('water_usage_records').select('record_date, water_volume_m3').eq('district', profile.district).order('record_date').limit(30);
    setWaterTrend(water || []);
    const { data: maint } = await supabase.from('maintenance_reports').select('*, farms(farm_name)').eq('escalated_to', 'DIO');
    setMaintenance(maint || []);
    setLoading(false);
  }

  async function resolveMaintenance(id) {
    const { error } = await supabase.from('maintenance_reports').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Resolved'); fetchData(); }
  }

  const csvData = prepareCSVData(waterTrend, [{ label: 'Date', key: 'record_date' }, { label: 'Volume (m³)', key: 'water_volume_m3' }]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">DIO - {profile.district}</h1><ExportButtons csvData={csvData} pdfData={waterTrend} pdfTitle="Water Usage" filename="dio_water" columns={[{ label: 'Date', key: 'record_date' }, { label: 'Volume', key: 'water_volume_m3' }]} /></div>
      <div className="bg-white p-4 rounded shadow mb-6"><h2 className="text-lg font-semibold mb-3">Water Usage Trend</h2><ResponsiveContainer width="100%" height={300}><LineChart data={waterTrend}><XAxis dataKey="record_date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="water_volume_m3" stroke="#3b82f6" /></LineChart></ResponsiveContainer></div>
      <div className="bg-white p-4 rounded shadow"><h2 className="text-lg font-semibold mb-3">Escalated Maintenance</h2>{maintenance.length === 0 ? <p>None</p> : maintenance.map(m => (<div key={m.id} className="border-b py-2"><p><strong>{m.farms?.farm_name}</strong>: {m.issue}</p><p>Status: {m.status}</p>{m.status !== 'resolved' && <button onClick={() => resolveMaintenance(m.id)} className="bg-green-500 text-white px-2 py-1 text-sm rounded">Resolve</button>}</div>))}</div>
    </div>
  );
}