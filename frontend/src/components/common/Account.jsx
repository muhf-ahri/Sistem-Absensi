import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../utils/API";
import {
  User,
  Mail,
  Briefcase,
  Save,
  Edit2,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";

const Account = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        position: user.position || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const updateData = {
        userId: user.id,
        name: formData.name,
        email: formData.email,
        position: formData.position,
      };

      const response = await api.put("/users/profile/update", updateData);

      setMessage({
        type: "success",
        text: response.data.message || "Profile berhasil diupdate!",
      });
      setEditMode(false);

      // Update user context/local storage
      const updatedUser = { ...user, ...updateData };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Optional: reload setelah 2 detik
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Gagal update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    // Validation
    if (formData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password baru minimal 6 karakter",
      });
      setSaving(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: "error",
        text: "Password baru dan konfirmasi tidak sama",
      });
      setSaving(false);
      return;
    }

    try {
      const changePasswordData = {
        userId: user.id,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };

      const response = await api.put(
        "/users/profile/change-password",
        changePasswordData
      );

      setMessage({
        type: "success",
        text: response.data.message || "Password berhasil diubah!",
      });

      // Reset password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Gagal mengubah password",
      });
    } finally {
      setSaving(false);
    }
  };

  const clearMessage = () => {
    setMessage({ type: "", text: "" });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">User tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Pengaturan Akun
            </h2>
            <p className="text-gray-600">
              Kelola data profile dan keamanan akun Anda
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 lg:mt-0">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === "admin"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {user.role === "admin" ? "Administrator" : "Karyawan"}
            </span>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div
          className={`rounded-xl p-4 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  message.type === "success" ? "text-green-800" : "text-red-800"
                }`}
              >
                {message.text}
              </span>
            </div>
            <button
              onClick={clearMessage}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Informasi Profile</span>
            </h3>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Edit2 className="h-3 w-3" />
                <span>Edit</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditMode(false);
                  // Reset form data ketika batal
                  setFormData({
                    name: user.name || "",
                    email: user.email || "",
                    position: user.position || "",
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Batal
              </button>
            )}
          </div>

          <form onSubmit={handleProfileUpdate}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posisi
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    required
                  />
                </div>
              </div>

              {editMode && (
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Security Settings */}
        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Key className="h-5 w-5 text-green-600" />
              <span>Ubah Password</span>
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-5">
              {/* Password Saat Ini */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Minimal 6 karakter</p>
              </div>

              {/* Konfirmasi Password Baru */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Tombol Simpan */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Key className="h-4 w-4" />
                  <span>{saving ? "Mengubah..." : "Ubah Password"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-600" />
              <span>Informasi Akun</span>
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">User ID</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.id}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Role</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {user.role}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tanggal Bergabung</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("id-ID")
                    : "Unknown"}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={logout}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Keluar dari Akun
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Tips Keamanan
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Gunakan password yang kuat dan unik</li>
          <li>• Jangan bagikan password Anda kepada siapapun</li>
          <li>• Selalu logout setelah menggunakan aplikasi</li>
          <li>• Perbarui password secara berkala</li>
        </ul>
      </div>
    </div>
  );
};

export default Account;
