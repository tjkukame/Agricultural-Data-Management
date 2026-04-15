import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AssignAAModal from '../../components/modals/AssignAAModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExportButtons from '../../components/common/ExportButtons';
import { prepareCSVData } from '../../utils/exportUtils.jsx';

export default function ATOIrrigationDashboard() {
  const { profile } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [waterData, setWaterData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchemes() {
      const { data } = await supabase
        .from('irrigation_schemes')
        .select('*')
        .eq('district', profile.district);
      setSchemes(data || []);
      setLoading(false);
    }
    fetchSchemes();
  }, [profile.district]);

  useEffect(() => {
    if (!selectedScheme) return;
    async function fetchWater() {
      const { data } = await supabase
        .from('water_usage_records')
        .select('record_date, water_volume_m3')
        .eq('irrigation_scheme_id', selectedScheme.id)
        .order('record_date', { ascending: true })
        .limit(30);
      setWaterData(data || []);
    }
    fetchWater();
  }, [selectedScheme]);

  const csvData = prepareCSVData(waterData, [
    { label: 'Date', key: 'record_date' },
    { label: 'Volume (m³)', key: 'water_volume_m3' },
  ]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">ATO Irrigation - {profile.district}</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Select Scheme</label>
        <select className="border rounded px-3 py-2 w-64" onChange={(e) => setSelectedScheme(schemes.find(s => s.id === e.target.value))}>
          <option value="">-- Choose scheme --</option>
          {schemes.map(s => <option key={s.id} value={s.id}>{s.scheme_name}</option>)}
        </select>
      </div>
      {selectedScheme && (
        <>
          <div className="mb-4">
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Assign AA</button>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Water Usage Trend</h2>
              <ExportButtons csvData={csvData} pdfData={waterData} pdfTitle="Water Usage" filename="water_usage" columns={[{ label: 'Date', key: 'record_date' }, { label: 'Volume (m³)', key: 'water_volume_m3' }]} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={waterData}>
                <XAxis dataKey="record_date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="water_volume_m3" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {showModal && <AssignAAModal scheme={selectedScheme} onClose={() => setShowModal(false)} onAssigned={() => {}} />}
        </>
      )}
    </div>
  );
}