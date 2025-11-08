import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import Navbar from './assets/components/Navbar';
import LoginForm from './assets/components/LoginForm';
import MapView from './assets/components/MapView';
import ReportForm from './assets/components/ReportForm';
import ReportList from './assets/components/ReportList';
import CouncilDashboard from './assets/components/CouncilDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setUser({ ...currentUser, ...data });
          } else {
            setUser(currentUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <Routes>
          {/* Public Route - Home/Map */}
          <Route 
            path="/" 
            element={
              <div className="h-[calc(100vh-4rem)]">
                <MapView />
              </div>
            } 
          />

          {/* Login Route */}
          <Route 
            path="/login" 
            element={
              user ? (
                <Navigate to={userData?.roles?.includes('council') ? '/council' : '/citizen'} replace />
              ) : (
                <LoginForm />
              )
            } 
          />

          {/* Citizen Interface */}
          <Route 
            path="/citizen" 
            element={
              user ? (
                <CitizenInterface user={user} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* Council Interface */}
          <Route 
            path="/council" 
            element={
              user && userData?.roles?.includes('council') ? (
                <CouncilDashboard user={user} />
              ) : user ? (
                <Navigate to="/citizen" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

// Citizen Interface Component
function CitizenInterface({ user }) {
  const [activeTab, setActiveTab] = useState('map');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Citizen Dashboard</h1>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'map'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Map View
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'report'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Submit Report
          </button>
          <button
            onClick={() => setActiveTab('myreports')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'myreports'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            My Reports
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'map' && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
              <MapView />
            </div>
          )}

          {activeTab === 'report' && (
            <ReportForm user={user} onSuccess={() => setActiveTab('myreports')} />
          )}

          {activeTab === 'myreports' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Reports</h2>
              <ReportList user={user} filterByUser={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
