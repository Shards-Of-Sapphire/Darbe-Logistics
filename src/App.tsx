import React, { useState, useEffect } from 'react';
import { storage } from './lib/storage';
import { User, UserRole } from './types';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'login' | 'signup' | 'dashboard'>('login');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // Load user data
      const savedUser = storage.getUser();
      if (savedUser) {
        setUser(savedUser);
        setCurrentPage('dashboard');
      }
      setIsInitialized(true);

      // Force minimum loading time for the splash screen
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };

    initApp();
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    storage.setUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    storage.setUser(null);
    setCurrentPage('login');
  };

  if (!isInitialized) return null;

  return (
    <>
      <AnimatePresence>
        {isLoading && <LoadingScreen />}
      </AnimatePresence>
      
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />
      {user && <Navbar user={user} onLogout={handleLogout} />}
      
      <main className="flex-1">
        {currentPage === 'login' && (
          <Login onLogin={handleLogin} onSwitchToSignup={() => setCurrentPage('signup')} />
        )}
        {currentPage === 'signup' && (
          <Signup onSignup={handleLogin} onSwitchToLogin={() => setCurrentPage('login')} />
        )}
        {currentPage === 'dashboard' && user && (
          user.role === 'Admin' ? <AdminDashboard /> : <StaffDashboard />
        )}
      </main>
      
      <footer className="py-6 px-4 text-center text-gray-500 text-sm bg-white border-t border-gray-100 no-print">
        &copy; {new Date().getFullYear()} Darbe Logistics. Modern Logistics Solutions.
      </footer>
    </div>
    </>
  );
}
