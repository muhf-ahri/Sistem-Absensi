import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Dashboard from '../components/admin/Dashboard';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import AttendanceHistory from '../components/admin/AttendanceHistory';
import Reports from '../components/admin/Reports';
import OfficeSettings from '../components/admin/OfficeSettings';
import Account from '../components/common/Account'; // ✅ TAMBAHKAN

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/attendance" element={<AttendanceHistory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<OfficeSettings />} />
            <Route path="/account" element={<Account />} /> {/* ✅ TAMBAHKAN */}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;