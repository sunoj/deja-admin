import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProposalList from './pages/ProposalList';
import ProposalDetail from './pages/ProposalDetail';
import CreateProposal from './pages/CreateProposal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/proposals"
            element={
              <PrivateRoute>
                <ProposalList />
              </PrivateRoute>
            }
          />
          <Route
            path="/proposals/create"
            element={
              <PrivateRoute>
                <CreateProposal />
              </PrivateRoute>
            }
          />
          <Route
            path="/proposals/:id"
            element={
              <PrivateRoute>
                <ProposalDetail />
              </PrivateRoute>
            }
          />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </AuthProvider>
  );
}

export default App; 