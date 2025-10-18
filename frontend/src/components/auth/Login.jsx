import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSweetAlert } from '../../hooks/useSweetAlert';
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Gunakan custom hook SweetAlert
  const {
    successToast,
    errorToast,
    loading: showLoadingAlert,
    close: closeAlert
  } = useSweetAlert();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      errorToast('Email harus diisi');
      return false;
    }

    if (!formData.password) {
      errorToast('Password harus diisi');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errorToast('Format email tidak valid');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const loadingAlert = showLoadingAlert('Memproses login...');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        const user = JSON.parse(localStorage.getItem('user'));
        closeAlert();
        
        // Show success message based on role
        const roleName = user.role === 'admin' ? 'Administrator' : 
                        user.role === 'hr' ? 'HR' : 'Karyawan';
        
        successToast(`Selamat datang, ${user.name || roleName}!`, 3000);
        
        // Navigate after a short delay to show the success message
        setTimeout(() => {
          navigate(`/${user.role}`);
        }, 1500);
      } else {
        closeAlert();
        
        // Show specific error messages
        let errorMessage = 'Login gagal';
        if (result.error?.includes('invalid') || result.error?.includes('credentials')) {
          errorMessage = 'Email atau password salah';
        } else if (result.error?.includes('network') || result.error?.includes('connection')) {
          errorMessage = 'Koneksi jaringan bermasalah. Silakan coba lagi.';
        } else if (result.error?.includes('timeout')) {
          errorMessage = 'Waktu login habis. Silakan coba lagi.';
        } else {
          errorMessage = result.error || 'Terjadi kesalahan saat login';
        }
        
        setError(errorMessage);
        errorToast(errorMessage);
      }
    } catch (error) {
      closeAlert();
      const errorMessage = 'Terjadi kesalahan tak terduga. Silakan coba lagi.';
      setError(errorMessage);
      errorToast(errorMessage);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Masuk ke Akun
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistem Absensi Karyawan Modern
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                <p className="text-sm text-red-600 mt-1">
                  Periksa kembali email dan password Anda
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="masukkan email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="masukkan password"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Memproses...</span>
                </div>
              ) : (
                'Masuk ke Sistem'
              )}
            </button>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Belum punya akun?{' '}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Daftar di sini
                </Link>
              </span>
            </div>
          </div>
        </form>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              © 2024 Sistem Absensi Karyawan. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Versi 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;