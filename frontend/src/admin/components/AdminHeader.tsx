import React, { useRef, type KeyboardEvent } from 'react';
import { Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/auth/store/auth.store';

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSearch = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;

    const query = inputRef.current?.value;

    if (!query) {
      navigate(`/admin/products`);
      return;
    }
    navigate(`/admin/products/?query=${query}`)
  }

  const inputRef = useRef<HTMLInputElement>(null);

  const getUserInitials = () => {
    if (!user?.first_name) return 'US';
    return user.first_name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 h-18">
      <div className="flex items-center justify-between">
        {/* Search */}
        {/* <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={inputRef}
              onKeyDown={handleSearch}
              type="text"
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div> */}

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Botón de Configuración */}
          <button
            onClick={() => navigate('/admin/settings')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Configuración"
          >
            <Settings size={20} />
          </button>

          {/* Avatar del Usuario */}
          <div
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => navigate('/admin/settings')}
            title="Ver perfil"
          >
            <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md hover:shadow-lg transition-shadow">
              {getUserInitials()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="text-xs text-gray-500">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

