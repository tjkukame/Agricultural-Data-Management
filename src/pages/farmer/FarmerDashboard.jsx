import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import PloughingForm from '../../components/forms/PloughingForm';
import PlantingForm from '../../components/forms/PlantingForm';
import FertilizerForm from '../../components/forms/FertilizerForm';
import IrrigationForm from '../../components/forms/IrrigationForm';
import HarvestForm from '../../components/forms/HarvestForm';
import MaintenanceForm from '../../components/forms/MaintenanceForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

export default function FarmerDashboard() {
  const { user, profile } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [activities, setActivities] = useState([]);
  const [maintenanceReports, setMaintenanceReports] = useState([]);
  const [showForm, setShowForm] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch farms
  useEffect(() => {
    async function fetchFarms() {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('farmer_id', user.id);
      if (!error) setFarms(data || []);
      setLoading(false);
    }
    fetchFarms();
  }, [user.id]);

  // Fetch activities and maintenance for selected farm
  const fetchFarmData = async () => {
    if (!selectedFarm) return;
    const { data: acts } = await supabase
      .from('activities')
      .select('*')
      .eq('farm_id', selectedFarm.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setActivities(acts || []);
    const { data: maint } = await supabase
      .from('maintenance_reports')
      .select('*')
      .eq('farm_id', selectedFarm.id)
      .order('created_at', { ascending: false });
    setMaintenanceReports(maint || []);
  };

  useEffect(() => {
    fetchFarmData();
  }, [selectedFarm]);

  // Real-time new activities
  useRealtimeSubscription('activities', 'farm_id', selectedFarm?.id, (payload) => {
    setActivities(prev => [payload.new, ...prev]);
  }, 'INSERT');

  // Real-time new maintenance
  useRealtimeSubscription('maintenance_reports', 'farm_id', selectedFarm?.id, (payload) => {
    setMaintenanceReports(prev => [payload.new, ...prev]);
  }, 'INSERT');

  if (loading) return <LoadingSpinner fullScreen />;
  if (farms.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No farms assigned yet. Please contact your Area Assistant.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <h1 className="text-2xl font-bold mb-2">Farmer Dashboard</h1>
      <p className="text-gray-600 mb-4">Welcome, {profile?.full_name}</p>

      {/* Farm selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Select Farm</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={selectedFarm?.id || ''}
          onChange={(e) => setSelectedFarm(farms.find(f => f.id === e.target.value))}
        >
          <option value="">-- Choose farm --</option>
          {farms.map(f => <option key={f.id} value={f.id}>{f.farm_name} ({f.size_ha} ha)</option>)}
        </select>
      </div>

      {selectedFarm && (
        <>
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => setShowForm('ploughing')} className="bg-blue-100 p-3 rounded text-center hover:bg-blue-200">🚜 Plough/Till</button>
            <button onClick={() => setShowForm('planting')} className="bg-green-100 p-3 rounded text-center hover:bg-green-200">🌱 Plant</button>
            <button onClick={() => setShowForm('fertilizer')} className="bg-yellow-100 p-3 rounded text-center hover:bg-yellow-200">💊 Fertilizer</button>
            <button onClick={() => setShowForm('irrigation')} className="bg-cyan-100 p-3 rounded text-center hover:bg-cyan-200">💧 Irrigate</button>
            <button onClick={() => setShowForm('harvest')} className="bg-orange-100 p-3 rounded text-center hover:bg-orange-200">🌾 Harvest</button>
            <button onClick={() => setShowForm('maintenance')} className="bg-red-100 p-3 rounded text-center hover:bg-red-200">🔧 Report Issue</button>
          </div>

          {/* Dynamic form */}
          {showForm && (
            <div className="bg-white p-4 rounded shadow mb-6 border">
              {showForm === 'ploughing' && <PloughingForm farmId={selectedFarm.id} onSuccess={() => { setShowForm(null); fetchFarmData(); }} />}
              {showForm === 'planting' && <PlantingForm farmId={selectedFarm.id} onSuccess={() => { setShowForm(null); fetchFarmData(); }} />}
              {showForm === 'fertilizer' && <FertilizerForm farmId={selectedFarm.id} onSuccess={() => { setShowForm(null); fetchFarmData(); }} />}
              {showForm === 'irrigation' && <IrrigationForm farmId={selectedFarm.id} onSuccess={() => { setShowForm(null); fetchFarmData(); }} />}
              {showForm === 'harvest' && <HarvestForm farmId={selectedFarm.id} onSuccess={() => { setShowForm(null); fetchFarmData(); }} />}
              {showForm === 'maintenance' && <MaintenanceForm farmId={selectedFarm.id} onSuccess={() => { setShowForm(null); fetchFarmData(); }} />}
              <button onClick={() => setShowForm(null)} className="text-gray-500 text-sm mt-2 underline">Cancel</button>
            </div>
          )}

          {/* Recent activities */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Recent Activities</h2>
            {activities.length === 0 ? <p className="text-gray-500">No activities yet.</p> : (
              <ul className="space-y-2">
                {activities.map(act => (
                  <li key={act.id} className="border rounded p-2 text-sm">
                    <span className="font-medium capitalize">{act.activity_type}</span> on {new Date(act.created_at).toLocaleString()}
                    <pre className="text-xs bg-gray-50 p-1 mt-1 rounded">{JSON.stringify(act.details, null, 2)}</pre>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Maintenance reports */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Maintenance Reports</h2>
            {maintenanceReports.length === 0 ? <p className="text-gray-500">No reports.</p> : (
              <ul className="space-y-2">
                {maintenanceReports.map(m => (
                  <li key={m.id} className="border rounded p-2 text-sm">
                    <p><strong>Issue:</strong> {m.issue}</p>
                    <p><strong>Status:</strong> {m.status}</p>
                    <p className="text-xs text-gray-500">Reported: {new Date(m.created_at).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}