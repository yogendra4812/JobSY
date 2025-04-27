import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase as BriefcaseBusiness, LogOut, User as UserIcon } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo / Brand */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/jobs')}>
              <BriefcaseBusiness className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl">JobSY</span>
            </div>

            {/* always show these nav buttons */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center text-white hover:text-indigo-200"
              >
                <UserIcon className="h-5 w-5 mr-1" />
                <span>Profile</span>
              </button>
              
              <button 
                onClick={() => navigate('/jobs')}
                className="flex items-center text-white hover:text-indigo-200"
              >
                <BriefcaseBusiness className="h-5 w-5 mr-1" />
                <span>Jobs</span>
              </button>

              {isAuthenticated ? (
                <button 
                  onClick={handleLogoutClick}
                  className="flex items-center text-white hover:text-indigo-200"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Logout</span>
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="flex items-center text-white hover:text-indigo-200"
                >
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Confirm Logout</h2>
            <p className="mb-6 text-gray-600">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
