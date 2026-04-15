import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import PloughingForm from '../../components/forms/PloughingForm';
import PlantingForm from '../../components/forms/PlantingForm';
import FertilizerForm from '../../components/forms/FertilizerForm';
import IrrigationForm from '../../components/forms/IrrigationForm';
import HarvestForm from '../../components/forms/HarvestForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AADashboard() {
  const { profile } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [activities, setActivities] = useState([]);
  const [maintenanceReports, setMaintenanceReports] = useState([]);
  const [showForm, setShowForm] = useState(null);
  const [dailySummary, setDailySummary] = useState({ ploughed: 0, seeded: 0, irrigated: 0 });
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Fetch farms assigned to this AA
  useEffect(() => {
    async function fetchAssignedFarms() {
      const { data: schemes } = await supabase
        .from('scheme_assignments')
        .select('irrigation_scheme_id')
        .eq('aa_id', profile.id);
      if (schemes?.length) {
        const schemeIds = schemes.map(s => s.irrigation_scheme_id);
        const { data: farmsData } = await supabase
          .from('farms')
          .select('*, profiles(full_name)')
          .in('irrigation_scheme_id', schemeIds);
        setFarms(farmsData || []);
      }
      setLoading(false);
    }
    fetchAssignedFarms();
  }, [profile.id]);

  const fetchFarmData = async () => {
    if (!selectedFarm) return;
    const { data: acts } = await supabase
      .from('activities')
      .select('*')
      .eq('farm_id', selectedFarm.id)
      .order('created_at', { ascending: false });
    setActivities(acts || []);
    const { data: maint } = await supabase
      .from('maintenance_reports')
      .select('*')
      .eq('farm_id', selectedFarm.id);
    setMaintenanceReports(maint || []);
  };

  const fetchDailySummary = async () => {
    const farmIds = farms.map(f => f.id);
    if (!farmIds.length) return;
    const { data } = await supabase
      .from('activities')
      .select('activity_type, details')
      .in('farm_id', farmIds)
      .gte('created_at', `${filterDate}T00:00:00`)
      .lt('created_at', `${filterDate}T23:59:59`);
    let ploughed = 0, seeded = 0, irrigated = 0;
    data?.forEach(act => {
      if (act.activity_type === 'ploughing') ploughed += act.details?.area_ploughed || 0;
      if (act.activity_type === 'planting') seeded += act.details?.area_seeded || 0;
      if (act.activity_type === 'irrigation') irrigated += act.details?.area_irrigated || 0;
    });
    setDailySummary({ ploughed, seeded, irrigated });
  };

  useEffect(() => {
    if (selectedFarm) fetchFarmData();
  }, [selectedFarm]);

  useEffect(() => {
    fetchDailySummary();
  }, [filterDate, farms]);

  const escalateMaintenance = async (reportId) => {
    const { error } = await supabase
      .from('maintenance_reports')
      .update({ status: 'escalated', escalated_to: 'ATO' })
      .eq('id', reportId);
    if (error) toast.error(error.message);
    else {
      toast.success('Escalated to ATO');
      fetchFarmData();
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (farms.length === 0) {
    return <div className="p-6 text-center">No farms assigned. Contact your ATO Irrigation.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">AA Dashboard</h1>
      <p className="text-gray-600 mb-4">Area: {profile.area || profile.district}</p>

      {/* Daily summary */}
      <div className="bg-blue-50 p-4 rounded shadow mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Daily Summary</h2>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>Ploughed: {dailySummary.ploughed} ha</div>
          <div>Seeded: {dailySummary.seeded} ha</div>
          <div>Irrigated: {dailySummary.irrigated} ha</div>
        </div>
      </div>

      {/* Farm selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Select Farm</label>
        <select className="w-full border rounded px-3 py-2" value={selectedFarm?.id || ''} onChange={(e) => setSelectedFarm(farms.find(f => f.id === e.target.value))}>
          <option value="">-- Choose farm --</option>
          {farms.map(f => <option key={f.id} value={f.id}>{f.farm_name} (Farmer: {f.profiles?.full_name})</option>)}
        </select>
      </div>

      {selectedFarm && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => setShowForm('ploughing')} className="bg-blue-100 p-2 rounded">🚜 Plough</button>
            <button onClick={() => setShowForm('planting')} className="bg-green-100 p-2 rounded">🌱 Plant</button>
            <button onClick={() => setShowForm('fertilizer')} className="bg-yellow-100 p-2 rounded">💊 Fertilizer</button>
            <button onClick={() => setShowForm('irrigation')} className="bg-cyan-100 p-2 rounded">💧 Irrigate</button>
            <button onClick={() => setShowForm('harvest')} className="bg-orange-100 p-2 rounded">🌾 Harvest</button>
          </div>

          {showForm && (
            <div className="bg-white p-4 rounded shadow mb-4 border">
              {showForm === 'ploughing' && <PloughingForm farmId={selectedFarm.id} onSuccess={() => { setShowForm(null); fetchFarmData(); fetchDailySummary(); }} />}
              {showForm === 'planting' && <PlantingForm farmId={selectedFarm.id} onSuccess={() => { setShowForm(null); fetchFarmData(); fetchDailySummary(); }} />}
              {showForm === 'fertilizer' && <FertilizerForm farmId={selectedFarm.id} onSuccess={() => { setShowForm(null); fetchFarmData(); }} />}
              {showForm === 'irrigation' && <IrrigationForm farmId={selectedFarm.id} onSuccess={() => { setShowForm(null); fetchFarmData(); fetchDailySummary(); }} />}
              {showForm === 'harvest' && <HarvestForm farmId={selectedFarm.id} onSuccess={() => { setShowForm(null); fetchFarmData(); }} />}
              <button onClick={() => setShowForm(null)} className="text-gray-500 text-sm underline mt-2">Cancel</button>
            </div>
          )}

          {/* Maintenance list */}
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Maintenance Reports</h2>
            {maintenanceReports.map(m => (
              <div key={m.id} className="border p-2 rounded mb-2">
                <p><strong>Issue:</strong> {m.issue}</p>
                <p><strong>Status:</strong> {m.status}</p>
                {m.status !== 'escalated' && (
                  <button onClick={() => escalateMaintenance(m.id)} className="bg-yellow-500 text-white px-2 py-1 text-sm rounded mt-1">Escalate to ATO</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}