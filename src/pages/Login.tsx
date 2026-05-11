import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, Package } from 'lucide-react';
import { User, UserRole } from '../types';
import { cn, generateId } from '../lib/utils';
import { storage } from '../lib/storage';
import toast from 'react-hot-toast';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToSignup: () => void;
}

export default function Login({ onLogin, onSwitchToSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('Staff');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const user = storage.verifyUser(email, password);
    
    if (user) {
      if (user.role !== role) {
        toast.error(`This account is registered as ${user.role}, not ${role}`);
        return;
      }
      toast.success(`Logged in as ${user.name}`);
      onLogin(user);
    } else {
      toast.error('Invalid email or password. Please register if you haven\'t.');
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-olive-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-olive-200">
            <Package size={36} />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to manage your logistics operations
          </p>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setRole('Staff')}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              role === 'Staff' ? "bg-white text-olive-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Staff
          </button>
          <button
            onClick={() => setRole('Admin')}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              role === 'Admin' ? "bg-white text-olive-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Admin
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 sm:text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-olive-600 hover:bg-olive-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-olive-500 transition-all shadow-lg shadow-olive-100 active:scale-95"
          >
            Sign In
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-sm font-medium text-olive-600 hover:text-olive-500"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
