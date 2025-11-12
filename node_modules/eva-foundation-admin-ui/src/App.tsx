/**
 * EVA Foundation 2.0 - Admin Dashboard
 * Enterprise-grade admin interface for AI platform management
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DocumentManagement } from './pages/DocumentManagement';
import { UserManagement, SecurityConsole, Analytics, Settings } from './pages';
import { AuthenticationGuard } from './components/AuthenticationGuard';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <AuthenticationGuard>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<DocumentManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/security" element={<SecurityConsole />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </AuthenticationGuard>
    </Router>
  );
};

export default App;
