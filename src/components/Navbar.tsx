import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase as BriefcaseBusiness, LogOut, User as UserIcon } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has uploaded a resume (has skills)
  const hasUploadedResume = user?.skills && user.skills.length > 0;

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      logout();
      navigate('/');
    }
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <BriefcaseBusiness className="h-8 w-8 mr-2" />
            <span className="font-bold text-xl cursor-pointer" onClick={() => navigate('/')}>
              JobSY
            </span>
          </div>
          
          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              {hasUploadedResume && (
                <>
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
                </>
              )}
              
              <button 
                onClick={handleLogout}
                className="flex items-center text-white hover:text-indigo-200"
              >
                <LogOut className="h-5 w-5 mr-1" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;