'use client';

import { useState } from 'react';
import { BellIcon, UserIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useSidebarStore } from '@/store/sidebar-store';

export function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { toggle } = useSidebarStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Section - Logo and Mobile Menu Toggle */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={toggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg gradient-industrial flex items-center justify-center">
              <span className="text-white font-bold text-sm">PG</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">NeuraMaint</h1>
              <p className="text-xs text-gray-500">Predictive Maintenance</p>
            </div>
          </div>
        </div>

        {/* Right Section - Notifications and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Notifications"
          >
            <BellIcon className="h-6 w-6 text-gray-600" />
            {/* Notification Badge */}
            <span className="absolute top-0 right-0 h-3 w-3 bg-status-critical rounded-full border-2 border-white"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label="User menu"
            >
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">João Silva</p>
                <p className="text-xs text-gray-500">Técnico de Manutenção</p>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  Perfil
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  Configurações
                </a>
                <hr className="my-1 border-gray-200" />
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-status-critical hover:bg-gray-100 transition-colors duration-200"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}