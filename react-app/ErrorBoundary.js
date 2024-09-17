import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserTable from './components/UserTable';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';

const App = () => (
  <AuthProvider>
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/users" element={<UserTable />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  </AuthProvider>
);

export default App;
