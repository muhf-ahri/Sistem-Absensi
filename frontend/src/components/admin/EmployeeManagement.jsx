import React, { useState, useEffect } from 'react';
import { api } from '../../utils/API';
import { useSweetAlert } from '../../hooks/useSweetAlert';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Mail, 
  Briefcase, 
  Key,
  RefreshCw
} from 'lucide-react';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    role: 'employee',
    password: 'password123'
  });

  // Gunakan custom hook SweetAlert
  const {
    successToast,
    errorToast,
    warningToast,
    confirmation,
    successDialog,
    errorDialog,
    loading: showLoadingAlert,
    close: closeAlert
  } = useSweetAlert();

  useEffect(() => {
    loadEmployees();
  }, []);

  const transformEmployeeData = (employees) => {
    return employees.map(employee => ({
      ...employee,
      id: employee._id || employee.id, // Transform _id menjadi id
      name: employee.name || '',
      email: employee.email || '',
      position: employee.position || '',
      role: employee.role || 'employee',
      createdAt: employee.createdAt || employee.created_date
    }));
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const loadingAlert = showLoadingAlert("Memuat data karyawan...");

      const response = await api.get('/users');
      console.log('Raw employees data:', response.data);
      
      // Transform data dari backend
      const transformedEmployees = transformEmployeeData(response.data);
      console.log('Transformed employees:', transformedEmployees);
      
      setEmployees(transformedEmployees);

      closeAlert();
      successToast("Data karyawan berhasil dimuat", 2000);
    } catch (error) {
      closeAlert();
      console.error('Error loading employees:', error);
      console.error('Error details:', error.response);
      errorDialog(
        "Gagal Memuat Data",
        error.response?.data?.error || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      errorToast("Nama lengkap harus diisi");
      return false;
    }

    if (!formData.email.trim()) {
      errorToast("Email harus diisi");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errorToast("Format email tidak valid");
      return false;
    }

    if (!formData.position.trim()) {
      errorToast("Posisi harus diisi");
      return false;
    }

    if (!editingEmployee && !formData.password) {
      errorToast("Password harus diisi");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const loadingAlert = showLoadingAlert(
        editingEmployee ? "Mengupdate data karyawan..." : "Menambahkan karyawan baru..."
      );

      if (editingEmployee) {
        // Update employee - hanya update data, tanpa password
        const { password, ...updateData } = formData;
        
        // Gunakan ID yang benar (baik _id maupun id)
        const employeeId = editingEmployee._id || editingEmployee.id;
        console.log('Updating employee with ID:', employeeId);
        console.log('Update data:', updateData);
        
        const response = await api.put(`/users/${employeeId}`, updateData);
        console.log('Update response:', response);
        
        closeAlert();
        successDialog(
          "Berhasil Update",
          `Data karyawan ${formData.name} berhasil diupdate`
        );
      } else {
        // Register new employee
        console.log('Adding new employee:', formData);
        await api.post('/auth/register', formData);
        
        closeAlert();
        successDialog(
          "Berhasil Tambah",
          `Karyawan ${formData.name} berhasil ditambahkan`
        );
      }
      
      setShowAddModal(false);
      setEditingEmployee(null);
      setFormData({ name: '', email: '', position: '', role: 'employee', password: 'password123' });
      loadEmployees();
    } catch (error) {
      closeAlert();
      console.error('Submit error:', error);
      console.error('Error response:', error.response);
      errorDialog(
        editingEmployee ? "Gagal Update" : "Gagal Tambah",
        error.response?.data?.error || 'Terjadi kesalahan'
      );
    }
  };

  const handleEdit = (employee) => {
    console.log('Editing employee:', employee);
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      position: employee.position,
      role: employee.role,
      password: 'password123' // Tidak digunakan saat update, hanya untuk konsistensi form
    });
    setShowAddModal(true);
  };

  const handleDelete = async (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    
    const confirmationResult = await confirmation(
      "Hapus Karyawan",
      `Apakah Anda yakin ingin menghapus karyawan ${employee?.name}? Tindakan ini tidak dapat dibatalkan.`,
      "Ya, Hapus"
    );

    if (!confirmationResult.isConfirmed) {
      return;
    }

    try {
      const loadingAlert = showLoadingAlert("Menghapus karyawan...");

      // Gunakan ID yang benar
      const idToDelete = employee._id || employeeId;
      console.log('Deleting employee with ID:', idToDelete);
      
      await api.delete(`/users/${idToDelete}`);
      
      closeAlert();
      successDialog(
        "Berhasil Hapus",
        `Karyawan ${employee?.name} berhasil dihapus`
      );
      
      loadEmployees();
    } catch (error) {
      closeAlert();
      console.error('Delete error:', error);
      errorDialog(
        "Gagal Hapus",
        error.response?.data?.error || 'Gagal menghapus karyawan'
      );
    }
  };

  const resetPassword = async (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    
    const confirmationResult = await confirmation(
      "Reset Password",
      `Reset password ${employee?.name} ke "password123"? Karyawan harus login ulang setelah reset.`,
      "Ya, Reset"
    );

    if (!confirmationResult.isConfirmed) {
      return;
    }

    try {
      const loadingAlert = showLoadingAlert("Mereset password...");

      // Gunakan ID yang benar
      const idToReset = employee._id || employeeId;
      console.log('Resetting password for employee ID:', idToReset);
      
      await api.post(`/users/${idToReset}/reset-password`, {
        newPassword: 'password123'
      });
      
      closeAlert();
      successDialog(
        "Berhasil Reset",
        `Password ${employee?.name} berhasil direset ke "password123"`
      );
    } catch (error) {
      closeAlert();
      console.error('Reset password error:', error);
      errorDialog(
        "Gagal Reset",
        error.response?.data?.error || 'Gagal reset password'
      );
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setFormData({ 
      name: '', 
      email: '', 
      position: '', 
      role: 'employee', 
      password: 'password123' 
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    if (formData.name || formData.email || formData.position) {
      confirmation(
        "Batalkan Perubahan",
        "Data yang sudah diisi akan hilang. Apakah Anda yakin?",
        "Ya, Batalkan"
      ).then((result) => {
        if (result.isConfirmed) {
          setShowAddModal(false);
          setEditingEmployee(null);
          setFormData({ name: '', email: '', position: '', role: 'employee', password: 'password123' });
          successToast("Perubahan dibatalkan", 2000);
        }
      });
    } else {
      setShowAddModal(false);
      setEditingEmployee(null);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Kelola Karyawan</h2>
            <p className="text-sm text-gray-600">Kelola data karyawan dan akses sistem</p>
          </div>
          <button
            onClick={handleAddEmployee}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button 
            onClick={loadEmployees}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Karyawan</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Posisi</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Role</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">Bergabung</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {employee.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {employee.name || 'No Name'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{employee.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-gray-900 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{employee.position || 'No Position'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        employee.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {employee.role === 'admin' ? 'Admin' : 'Karyawan'}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-xs text-gray-500">
                      {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Unknown'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => resetPassword(employee.id)}
                          className="text-yellow-600 hover:text-yellow-900 transition-colors p-1"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredEmployees.length === 0 && (
          <div className="text-center py-8 px-4">
            <Users className="h-10 w-10 mx-auto text-gray-400 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {employees.length === 0 ? 'Tidak ada karyawan' : 'Tidak ditemukan'}
            </h3>
            <p className="text-xs text-gray-600">
              {employees.length === 0 
                ? 'Tambahkan karyawan pertama dengan tombol "Tambah"' 
                : 'Tidak ada karyawan yang sesuai dengan pencarian Anda'
              }
            </p>
          </div>
        )}

        {/* Summary Info */}
        {!loading && filteredEmployees.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600">
              <div>
                Menampilkan <span className="font-semibold">{filteredEmployees.length}</span> dari{' '}
                <span className="font-semibold">{employees.length}</span> karyawan
              </div>
              <div className="flex gap-4 mt-1 sm:mt-0">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Karyawan: {employees.filter(emp => emp.role === 'employee').length}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Admin: {employees.filter(emp => emp.role === 'admin').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="email@perusahaan.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Posisi *
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Posisi/jabatan"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="employee">Karyawan</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {!editingEmployee && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password Default *
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Password untuk login pertama"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password default untuk login pertama kali
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingEmployee ? 'Update' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;