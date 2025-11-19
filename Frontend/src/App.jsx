import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import NavBar from './components/NavBar';

import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProjectListPage from './components/ProjectListPage';
import ProjectDetailPage from './components/ProjectDetailsPage';
import PostProjectPage from './components/PostProjectPage';
import UserProfilePage from './components/UserProfilePage';

import { ProtectedRoute } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="grow">
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/project/:id" element={<ProjectDetailPage />} />
            <Route path="/profile/:id" element={<UserProfilePage />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="/post-project" element={<PostProjectPage />} />
              {/* add more protected routes here */}
            </Route>

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-gray-800 text-gray-300 py-6 mt-16">
          <div className="container text-center">
            <p>&copy; 2025 FreelanceHub. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
