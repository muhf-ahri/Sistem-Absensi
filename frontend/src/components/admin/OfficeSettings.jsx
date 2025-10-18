import React, { useState, useEffect } from 'react';
import { api } from '../../utils/API';
import { MapPin, Building2, Clock, Save, Target, Users } from 'lucide-react';

const OfficeSettings = () => {
  const [settings, setSettings] = useState({
    officeLocation: {
      latitude: '',
      longitude: '',
      radius: '',
      address: ''
    },
    workingHours: {
      start: '',
      end: ''
    },
    companyName: ''
  });
  const [employeeWorkingHours, setEmployeeWorkingHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSection, setSaveSection] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
    loadEmployeeWorkingHours();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data) {
        setSettings(prev => ({
          ...prev,
          ...response.data,
          officeLocation: {
            ...prev.officeLocation,
            ...response.data.officeLocation
          },
          workingHours: {
            ...prev.workingHours,
            ...response.data.workingHours
          }
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      alert('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeWorkingHours = async () => {
    try {
      const response = await api.get('/settings/employee-working-hours');
      setEmployeeWorkingHours(response.data || []);
    } catch (error) {
      console.error('Error loading employee working hours:', error);
    }
  };

  const handleSave = async (section) => {
    setSaving(true);
    setSaveSection(section);
    
    try {
      if (section === 'location') {
        const { latitude, longitude, radius, address } = settings.officeLocation;
        
        if (!latitude || !longitude || !radius || !address) {
          alert('Harap lengkapi semua field lokasi kantor');
          return;
        }
        
        if (radius < 10) {
          alert('Radius minimal 10 meter');
          return;
        }
        
        await api.put('/settings/office-location', settings.officeLocation);
      } else if (section === 'general') {
        const { companyName, workingHours } = settings;
        
        if (!companyName.trim()) {
          alert('Nama perusahaan tidak boleh kosong');
          return;
        }
        
        if (!workingHours.start || !workingHours.end) {
          alert('Harap isi jam kerja dengan lengkap');
          return;
        }
        
        if (workingHours.start >= workingHours.end) {
          alert('Jam masuk harus lebih awal dari jam pulang');
          return;
        }
        
        await api.put('/settings', {
          workingHours: settings.workingHours,
          companyName: settings.companyName
        });
      }
      alert('Pengaturan berhasil disimpan');
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
      setSaveSection('');
    }
  };

  const handleSaveEmployeeHours = async (employeeId, workingHours) => {
    try {
      await api.put(`/settings/employee-working-hours/${employeeId}`, workingHours);
      alert('Jam kerja karyawan berhasil diperbarui');
      loadEmployeeWorkingHours(); // Reload data
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menyimpan jam kerja karyawan');
    }
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      officeLocation: {
        ...prev.officeLocation,
        [name]: value
      }
    }));
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    
    setSettings(prev => {
      if (name in prev.workingHours) {
        return {
          ...prev,
          workingHours: {
            ...prev.workingHours,
            [name]: value
          }
        };
      } else {
        return {
          ...prev,
          [name]: value
        };
      }
    });
  };

  const handleEmployeeHoursChange = (employeeId, field, value) => {
    setEmployeeWorkingHours(prev => 
      prev.map(employee => 
        employee.id === employeeId 
          ? { ...employee, workingHours: { ...employee.workingHours, [field]: value } }
          : employee
      )
    );
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser ini');
      return;
    }

    setSaving(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings(prev => ({
          ...prev,
          officeLocation: {
            ...prev.officeLocation,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }
        }));
        setSaving(false);
      },
      (error) => {
        let errorMessage = 'Gagal mendapatkan lokasi: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Akses lokasi ditolak oleh pengguna';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Informasi lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            errorMessage += 'Permintaan lokasi timeout';
            break;
          default:
            errorMessage += error.message;
        }
        alert(errorMessage);
        setSaving(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  const isSavingSection = (section) => saving && saveSection === section;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan Kantor</h2>
        <p className="text-gray-600">Kelola lokasi kantor, jam kerja, dan pengaturan umum</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="h-4 w-4 inline mr-2" />
            Pengaturan Umum
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'location'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="h-4 w-4 inline mr-2" />
            Lokasi Kantor
          </button>
        </div>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Building2 className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Pengaturan Umum</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Perusahaan *
              </label>
              <input
                type="text"
                name="companyName"
                value={settings.companyName}
                onChange={handleGeneralChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="PT. Perusahaan Contoh"
                required
              />
            </div>

            <div className="md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Masuk Default *
                  </label>
                  <input
                    type="time"
                    name="start"
                    value={settings.workingHours.start}
                    onChange={handleGeneralChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Pulang Default *
                  </label>
                  <input
                    type="time"
                    name="end"
                    value={settings.workingHours.end}
                    onChange={handleGeneralChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Jam kerja default akan digunakan untuk karyawan yang tidak memiliki pengaturan jam kerja khusus
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => handleSave('general')}
              disabled={isSavingSection('general')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSavingSection('general') ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Location Settings Tab */}
      {activeTab === 'location' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Lokasi Kantor</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude *
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={settings.officeLocation.latitude}
                onChange={handleLocationChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="-6.2088"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude *
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={settings.officeLocation.longitude}
                onChange={handleLocationChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="106.8456"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radius Absensi (meter) *
              </label>
              <input
                type="number"
                name="radius"
                value={settings.officeLocation.radius}
                onChange={handleLocationChange}
                min="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="100"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Jarak maksimum dari lokasi kantor untuk melakukan absensi (minimal 10 meter)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Kantor *
              </label>
              <textarea
                name="address"
                value={settings.officeLocation.address}
                onChange={handleLocationChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Jl. Contoh No. 123, Jakarta"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
            <button
              onClick={getCurrentLocation}
              disabled={saving}
              className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>{saving ? 'Mendeteksi...' : 'Gunakan Lokasi Saat Ini'}</span>
            </button>
            <button
              onClick={() => handleSave('location')}
              disabled={isSavingSection('location')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSavingSection('location') ? 'Menyimpan...' : 'Simpan Lokasi'}</span>
            </button>
          </div>
        </div>
      )}


      {/* Current Settings Preview */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Pengaturan Saat Ini</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Lokasi Kantor</p>
                <p className="text-gray-900 mt-1">
                  {settings.officeLocation.address || 
                    <span className="text-gray-400">Belum diatur</span>}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {settings.officeLocation.latitude && settings.officeLocation.longitude 
                    ? `${settings.officeLocation.latitude}, ${settings.officeLocation.longitude}`
                    : 'Koordinat belum diatur'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Radius Absensi</p>
                <p className="text-gray-900">
                  {settings.officeLocation.radius 
                    ? `${settings.officeLocation.radius} meter`
                    : <span className="text-gray-400">Belum diatur</span>
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Nama Perusahaan</p>
                <p className="text-gray-900">
                  {settings.companyName || 
                    <span className="text-gray-400">Belum diatur</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Jam Kerja Default</p>
                <p className="text-gray-900">
                  {settings.workingHours.start && settings.workingHours.end
                    ? `${settings.workingHours.start} - ${settings.workingHours.end}`
                    : <span className="text-gray-400">Belum diatur</span>
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficeSettings;