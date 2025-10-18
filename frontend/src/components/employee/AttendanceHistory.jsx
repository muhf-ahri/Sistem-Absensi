import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/API';
import { Calendar, Filter, Download, CheckCircle, XCircle, Clock } from 'lucide-react';

const AttendanceHistory = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    loadAttendanceHistory();
  }, []);

  const loadAttendanceHistory = async (filterParams = {}) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams(filterParams).toString();
      const response = await api.get(`/attendance/history/${user.id}?${params}`);
      setAttendance(response.data);
    } catch (error) {
      console.error('Error loading attendance history:', error);
      setError('Gagal memuat riwayat absensi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    const filterParams = {};
    if (filters.startDate) filterParams.startDate = filters.startDate;
    if (filters.endDate) filterParams.endDate = filters.endDate;
    loadAttendanceHistory(filterParams);
  };

  const handleReset = () => {
    setFilters({ startDate: '', endDate: '' });
    loadAttendanceHistory();
  };

  const getStatus = (record) => {
    if (!record.checkIn) return { text: 'Tidak Hadir', color: 'text-red-600', bg: 'bg-red-100' };
    if (record.checkIn && !record.checkOut) return { text: 'Hanya Check-in', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Lengkap', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Check-in', 'Check-out', 'Status', 'Lokasi Check-in', 'Lokasi Check-out'];
    const csvData = attendance.map(record => [
      record.date,
      record.checkIn ? new Date(record.checkIn.timestamp).toLocaleTimeString() : '-',
      record.checkOut ? new Date(record.checkOut.timestamp).toLocaleTimeString() : '-',
      getStatus(record).text,
      record.checkIn && record.checkIn.latitude !== undefined && record.checkIn.longitude !== undefined ? `${record.checkIn.latitude.toFixed(4)}, ${record.checkIn.longitude.toFixed(4)}` : '-',
      record.checkOut && record.checkOut.latitude !== undefined && record.checkOut.longitude !== undefined ? `${record.checkOut.latitude.toFixed(4)}, ${record.checkOut.longitude.toFixed(4)}` : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-absensi-${user.name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Riwayat Absensi</h2>
            <p className="text-gray-600">Lihat dan kelola riwayat kehadiran Anda</p>
          </div>
          <button
            onClick={exportToCSV}
            className="mt-4 lg:mt-0 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filter</h3>
        </div>
        
        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError('')}
                className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data</h3>
            <p className="text-gray-600">Tidak ada riwayat absensi untuk periode yang dipilih</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => {
                  const status = getStatus(record);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.checkIn ? (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{new Date(record.checkIn.timestamp).toLocaleTimeString()}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600">Tidak hadir</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.checkOut ? (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{new Date(record.checkOut.timestamp).toLocaleTimeString()}</span>
                            </div>
                          ) : record.checkIn ? (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <span className="text-yellow-600">Belum check-out</span>
                            </div>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.checkIn && record.checkIn.latitude !== undefined && record.checkIn.longitude !== undefined ? (
                          <div>
                            <div>Check-in: {record.checkIn.latitude.toFixed(4)}, {record.checkIn.longitude.toFixed(4)}</div>
                            {record.checkOut && record.checkOut.latitude !== undefined && record.checkOut.longitude !== undefined && (
                              <div>Check-out: {record.checkOut.latitude.toFixed(4)}, {record.checkOut.longitude.toFixed(4)}</div>
                            )}
                          </div>
                        ) : (
                          '-'
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