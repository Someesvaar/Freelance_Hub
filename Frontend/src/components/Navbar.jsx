import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';



export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (

    <nav className="bg-white shadow-md">
      <div className="container mx-auto py-4 px-4 md:px-0 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-indigo-600">
          FreelanceHub
        </Link>

        <div className="flex items-center space-x-4">
          <Link to="/projects" className="text-gray-600 hover:text-indigo-600">
            Browse Projects
          </Link>

          {isAuthenticated ? (
            <>
              {user && !user.is_freelancer && (
                <Link to="/post-project" className="px-3 py-1 bg-indigo-600 text-white rounded">
                  Post Project
                </Link>
              )}
              <Link to={`/profile/${user.id}`} className="text-gray-600 hover:text-indigo-600">
                Profile
              </Link>
              <button onClick={handleLogout} className="px-3 py-1 border rounded">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-indigo-600">
                Login
              </Link>
              <Link to="/register" className="px-3 py-1 bg-indigo-600 text-white rounded">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>

  );
}
