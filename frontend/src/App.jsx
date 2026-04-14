import React, { useContext } from 'react';
import { Loader2 } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import { AuthProvider, AuthContext } from './context/AuthContext';

const AppContent = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 className="spinner" size={48} />
                <p>Authenticating...</p>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            
            <Route path="/*" element={
                user ? (
                    <div className="app-container">
                        <Sidebar />
                        <main className="main-content">
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/transactions" element={<Transactions />} />
                                <Route path="/analytics" element={<Analytics />} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </main>
                    </div>
                ) : (
                    <Navigate to="/login" />
                )
            } />
        </Routes>
    );
};

function App() {
  return (
    <AuthProvider>
        <Router>
            <AppContent />
        </Router>
    </AuthProvider>
  );
}

export default App;
