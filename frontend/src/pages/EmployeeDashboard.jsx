import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Dashboard from '../components/employee/Dashboard';
import Attendance from '../components/employee/Attendance';
import AttendanceHistory from '../components/employee/AttendanceHistory';
import LeaveRequest from '../components/employee/LeaveRequest';
import OfficeMap from '../components/employee/OfficeMap';
import Account from '../components/common/Account'; // ✅ TAMBAHKAN

const EmployeeDashboard = () => {
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
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/history" element={<AttendanceHistory />} />
            <Route path="/leave" element={<LeaveRequest />} />
            <Route path="/map" element={<OfficeMap />} />
            <Route path="/account" element={<Account />} /> {/* ✅ TAMBAHKAN */}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;