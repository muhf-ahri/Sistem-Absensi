import React, { useState, useEffect } from 'react';
import { api } from '../../utils/API';
import { Calendar, Filter, Download, CheckCircle, XCircle, Clock, User } from 'lucide-react';

const AttendanceHistory = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    employee: ''
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    loadAttendance();
    loadEmployees();
  }, []);

  const loadAttendance = async (filterParams = {}) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams(filterParams).toString();
      const response = await api.get(`/attendance/all?${params}`);
      setAttendance(response.data);
    } catch (error) {
      console.error('Error loading attendance:', error);
      setError('Gagal memuat data absensi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Gagal memuat data karyawan. Silakan coba lagi.');
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    const filterParams = {};
    if (filters.startDate) filterParams.startDate = filters.startDate;
    if (filters.endDate) filterParams.endDate = filters.endDate;
    if (filters.employee) filterParams.employee = filters.employee;
    loadAttendance(filterParams);
  };

  const handleReset = () => {
    setFilters({ startDate: '', endDate: '', employee: '' });
    loadAttendance();
  };

  const getStatus = (record) => {
    if (!record.checkIn) return { text: 'Tidak Hadir', color: 'text-red-600', bg: 'bg-red-100' };
    if (record.checkIn && !record.checkOut) return { text: 'Hanya Check-in', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Lengkap', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Nama Karyawan', 'Email', 'Posisi', 'Check-in', 'Check-out', 'Status', 'Lokasi Check-in', 'Lokasi Check-out'];
    const csvData = attendance.map(record => [
      record.date,
      record.userName,
      record.userEmail,
      record.userPosition,
      record.checkIn ? new Date(record.checkIn.timestamp).toLocaleTimeString() : '-',
      record.checkOut ? new Date(record.checkOut.timestamp).toLocaleTimeString() : '-',
      getStatus(record).text,
      record.checkIn && record.checkIn.latitude !== undefined && record.checkIn.longitude !== undefined ? `${record.checkIn.latitude.toFixed(4)}, ${record.checkIn.longitude.toFixed(4)}` : '-',
      record.checkOut && record.checkOut.latitude !== undefined && record.checkOut.longitude !== undefined ? `${record.checkOut.latitude.toFixed(4)}, ${record.checkOut.longitude.toFixed(4)}` : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => `"${row.map(cell => cell.replace(/"/g, '""')).join('","')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-absensi-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Riwayat Absensi</h2>
            <p className="text-sm text-gray-600">Monitor absensi seluruh karyawan</p>
          </div>
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Filter</h3>
        </div>
        
        <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Karyawan</label>
            <select
              value={filters.employee}
              onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 px-4 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError('')}
                className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Calendar className="h-10 w-10 mx-auto text-gray-400 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">Tidak ada data</h3>
            <p className="text-xs text-gray-600">Tidak ada riwayat absensi untuk periode yang dipilih</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Tanggal</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Karyawan</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Check-in</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Check-out</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendance.map((record) => {
                  const status = getStatus(record);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {new Date(record.date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px] font-semibold">
                              {record.userName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{record.userName}</div>
                            <div className="text-xs text-gray-500">{record.userPosition}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {record.checkIn ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span>{new Date(record.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-red-600">–</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {record.checkOut ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            <span>{new Date(record.checkOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : record.checkIn ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-yellow-500" />
                            <span className="text-yellow-600">–</span>
                          </div>
                        ) : (
                          <span>–</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 hidden sm:table-cell">
                        {record.checkIn && record.checkIn.latitude !== undefined && record.checkIn.longitude !== undefined ? (
                          <div>
                            <div>In: {record.checkIn.latitude.toFixed(4)}, {record.checkIn.longitude.toFixed(4)}</div>
                            {record.checkOut && record.checkOut.latitude !== undefined && record.checkOut.longitude !== undefined && (
                              <div>Out: {record.checkOut.latitude.toFixed(4)}, {record.checkOut.longitude.toFixed(4)}</div>
                            )}
                          </div>
                        ) : (
                          '–'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;