import React from "react";
import { useAuth } from "../../context/AuthContext";
import { LogOut, User, Bell, Menu } from "lucide-react";

const Header = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Selamat Datang, {user?.name}!
              </h1>
              <p className="text-gray-600">
                {user?.role === "admin"
                  ? "Administrator Panel"
                  : "Employee Dashboard"}
              </p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
            </div>
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
