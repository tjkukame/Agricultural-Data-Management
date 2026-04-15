import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Unauthorized() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <div className="text-red-500 text-6xl mb-4">⛔</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}