import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User,
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  MapPin,
  Clock,
  Building2
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const adminMenu = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Kelola Karyawan', path: '/admin/employees', icon: Users },
    { name: 'Riwayat Absensi', path: '/admin/attendance', icon: Clock },
    { name: 'Laporan', path: '/admin/reports', icon: FileText },
    { name: 'Pengaturan Kantor', path: '/admin/settings', icon: Settings },
    { name: 'Akun Saya', path: '/admin/account', icon: User }, 
  ];

  const employeeMenu = [
    { name: 'Dashboard', path: '/employee', icon: LayoutDashboard },
    { name: 'Absensi', path: '/employee/attendance', icon: Clock },
    { name: 'Riwayat Absensi', path: '/employee/history', icon: Calendar },
    { name: 'Ajukan Cuti', path: '/employee/leave', icon: FileText },
    { name: 'Peta Kantor', path: '/employee/map', icon: MapPin },
    { name: 'Akun Saya', path: '/employee/account', icon: User },
  ];

  const menuItems = user?.role === 'admin' ? adminMenu : employeeMenu;

  // 🧩 Fix utama: hindari dashboard ikut aktif di halaman lain
  const isActive = (path) => {
    const basePaths = ['/admin', '/employee'];
    if (basePaths.includes(path)) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white shadow-lg border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center space-x-3 px-6 py-4 border-b border-gray-200">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AbsensiApp</h2>
              <p className="text-xs text-gray-600 capitalize">
                {user?.role === 'admin' ? 'Administrator' : 'Karyawan'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={`
                    group relative flex items-center space-x-3 px-4 py-3 rounded-lg
                    transition-all duration-200 ease-in-out overflow-hidden
                    ${active 
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                    }
                  `}
                >
                  {/* Garis biru di kiri saat aktif */}
                  <span
                    className={`
                      absolute left-0 top-0 h-full w-1 rounded-r-lg bg-blue-600
                      transition-all duration-300
                      ${active
                        ? 'opacity-100 scale-y-100'
                        : 'opacity-0 scale-y-0 group-hover:opacity-100 group-hover:scale-y-100'
                      }
                    `}
                  ></span>

                  <Icon
                    className={`h-5 w-5 transition-colors duration-200
                      ${active ? 'text-blue-600' : 'group-hover:text-blue-600'}`}
                  />
                  <span className="font-medium truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-600 capitalize truncate">
                  {user?.position}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
