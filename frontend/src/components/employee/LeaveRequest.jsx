import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/API';
import { useSweetAlert } from '../../hooks/useSweetAlert';
import { Calendar, FileText, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';

const LeaveRequest = () => {
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'cuti'
  });
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });
  const { user } = useAuth();
  
  // Gunakan custom hook SweetAlert
  const {
    successToast,
    errorToast,
    confirmation,
    successDialog,
    errorDialog,
    loading: showLoadingAlert,
    close: closeAlert
  } = useSweetAlert();

  useEffect(() => {
    loadLeaves();
    loadStats();
  }, []);

  const loadLeaves = async () => {
    try {
      const response = await api.get(`/leaves/user/${user.id}`);
      setLeaves(response.data);
    } catch (error) {
      console.error('Error loading leaves:', error);
      errorToast('Gagal memuat data pengajuan cuti');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/leaves/stats/${user.id}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      errorToast('Gagal memuat statistik cuti');
    }
  };

  const validateForm = () => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate < startDate) {
      errorToast('Tanggal selesai tidak boleh sebelum tanggal mulai');
      return false;
    }
    
    if (formData.reason.trim().length < 10) {
      errorToast('Alasan cuti minimal 10 karakter');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const confirmationResult = await confirmation(
      'Ajukan Cuti',
      `Apakah Anda yakin ingin mengajukan cuti ${formData.type} dari ${formData.startDate} hingga ${formData.endDate}?`,
      'Ya, Ajukan'
    );

    if (!confirmationResult.isConfirmed) {
      return;
    }

    const loadingAlert = showLoadingAlert('Mengajukan cuti...');
    
    try {
      await api.post('/leaves/apply', {
        userId: user.id,
        ...formData
      });
      
      setShowForm(false);
      setFormData({
        startDate: '',
        endDate: '',
        reason: '',
        type: 'cuti'
      });
      
      await loadLeaves();
      await loadStats();
      
      closeAlert();
      
      successDialog(
        'Pengajuan Berhasil!', 
        'Pengajuan cuti Anda telah berhasil dikirim dan sedang menunggu persetujuan.'
      );
    } catch (error) {
      closeAlert();
      const errorMessage = error.response?.data?.error || 'Terjadi kesalahan server';
      
      errorDialog(
        'Pengajuan Gagal',
        errorMessage
      );
    }
  };

  const handleCancelForm = async () => {
    if (formData.startDate || formData.endDate || formData.reason) {
      const result = await confirmation(
        'Batalkan Pengajuan',
        'Data yang sudah diisi akan hilang. Apakah Anda yakin ingin membatalkan?',
        'Ya, Batalkan'
      );
      
      if (result.isConfirmed) {
        setShowForm(false);
        setFormData({
          startDate: '',
          endDate: '',
          reason: '',
          type: 'cuti'
        });
        successToast('Pengajuan dibatalkan', 2000);
      }
    } else {
      setShowForm(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Disetujui';
      case 'rejected':
        return 'Ditolak';
      default:
        return 'Menunggu';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'cuti':
        return 'Cuti Tahunan';
      case 'sakit':
        return 'Sakit';
      case 'keluarga':
        return 'Keluarga';
      case 'lainnya':
        return 'Lainnya';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pengajuan Cuti</h2>
            <p className="text-gray-600">Kelola pengajuan cuti dan izin Anda</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 lg:mt-0 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Ajukan Cuti</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pengajuan</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disetujui</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menunggu</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ditolak</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Leave Application Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ajukan Cuti</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Cuti
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="cuti">Cuti Tahunan</option>
                  <option value="keluarga">Keluarga</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Jelaskan alasan pengajuan cuti..."
                  required
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">Minimal 10 karakter</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Ajukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leaves List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Riwayat Pengajuan</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada pengajuan</h3>
            <p className="text-gray-600">Ajukan cuti pertama Anda dengan menekan tombol "Ajukan Cuti"</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {leaves.map((leave) => (
              <div key={leave.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(leave.startDate).toLocaleDateString('id-ID')} - {new Date(leave.endDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">{getTypeText(leave.type)}</h4>
                    <p className="text-gray-600 mt-1">{leave.reason}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Diajukan pada {new Date(leave.appliedAt).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(leave.status)}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                      {getStatusText(leave.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequest;