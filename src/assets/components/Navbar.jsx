import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { MapPin, LogOut, User, FileText } from 'lucide-react';

export default function Navbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isCouncil = user?.roles?.includes('council');
  const isCitizen = !isCouncil;

  return (
    <nav className="bg-green-700 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <MapPin className="h-8 w-8" />
            <span className="text-xl font-bold">Carbon Sentinel</span>
          </Link>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                {isCitizen && (
                  <Link 
                    to="/citizen" 
                    className={`flex items-center space-x-1 hover:text-green-200 transition-colors ${
                      location.pathname === '/citizen' ? 'text-green-200 font-semibold' : ''
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Citizen Dashboard</span>
                  </Link>
                )}
                {isCouncil && (
                  <Link 
                    to="/council" 
                    className={`flex items-center space-x-1 hover:text-green-200 transition-colors ${
                      location.pathname === '/council' ? 'text-green-200 font-semibold' : ''
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Council Dashboard</span>
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-800 px-4 py-2 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="bg-green-600 hover:bg-green-800 px-4 py-2 rounded-md transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
