import React from 'react';
import { LogOut, User as UserIcon, Package } from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-olive-600 p-2 rounded-lg text-white">
                <Package size={24} />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                Darbe<span className="text-olive-600">Logistics</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-olive-50 rounded-full border border-olive-100">
              <div className="w-8 h-8 rounded-full bg-olive-600 flex items-center justify-center text-white">
                <UserIcon size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-olive-900 leading-none">{user.name}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-olive-600 font-mono">
                  {user.role}
                </span>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
