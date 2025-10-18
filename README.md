# 🚀 Sistem Absensi Karyawan

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.19.1-green.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.18-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<div align="center">
  <img src="https://img.shields.io/github/stars/muhf-ahri/Web-Absensi3?style=social" alt="GitHub stars" />
  <img src="https://img.shields.io/github/forks/muhf-ahri/Web-Absensi3?style=social" alt="GitHub forks" />
  <img src="https://img.shields.io/github/issues/muhf-ahri/Web-Absensi3" alt="GitHub issues" />
  <img src="https://img.shields.io/github/last-commit/muhf-ahri/Web-Absensi3" alt="Last commit" />
</div>

---

## 📋 Table of Contents
- [✨ Fitur Utama](#-fitur-utama)
- [🎯 Demo](#-demo)
- [🛠️ Tech Stack](#️-tech-stack)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Instalasi & Setup](#-instalasi--setup)
- [🎯 Cara Penggunaan](#-cara-penggunaan)
- [📡 API Documentation](#-api-documentation)
- [🏗️ Arsitektur Sistem](#️-arsitektur-sistem)
- [🔧 Environment Variables](#-environment-variables)
- [🚀 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [🔍 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📞 Contact](#-contact)
- [🙏 Acknowledgments](#-acknowledgments)

---

## ✨ Fitur Utama

### 👨‍💼 **Dashboard Admin**
- ✅ **Manajemen Karyawan**: Tambah, edit, hapus data karyawan dengan mudah
- ✅ **Monitoring Real-time**: Pantau kehadiran semua karyawan secara langsung
- ✅ **Laporan & Analitik**: Generate laporan kehadiran dengan visualisasi chart
- ✅ **Pengaturan Kantor**: Konfigurasi lokasi kantor dan jam kerja fleksibel
- ✅ **Persetujuan Cuti**: Approve/reject permintaan cuti dengan notifikasi
- ✅ **Dashboard Analytics**: Overview performa karyawan dan statistik kehadiran

### 👷‍♂️ **Dashboard Karyawan**
- ✅ **Check-in/Check-out Otomatis**: Absensi dengan validasi lokasi real-time
- ✅ **Riwayat Kehadiran**: Lihat history absensi pribadi dengan filter tanggal
- ✅ **Permintaan Cuti**: Ajukan cuti dengan berbagai jenis dan alasan
- ✅ **Peta Kantor Interaktif**: Visualisasi lokasi kantor menggunakan Leaflet
- ✅ **Dashboard Pribadi**: Overview status kehadiran dan performa bulanan
- ✅ **Notifikasi Real-time**: Update status absensi dan persetujuan cuti

### 🔐 **Sistem Autentikasi & Keamanan**
- ✅ **JWT Authentication**: Sistem login aman dengan token-based authentication
- ✅ **Role-based Access Control**: Permission system untuk Admin vs Employee
- ✅ **Password Hashing**: Keamanan password menggunakan bcryptjs
- ✅ **Session Management**: Auto-logout dan token refresh mechanism
Sebelum menjalankan project ini, pastikan Anda memiliki:

- 🟢 **Node.js** versi 18 atau lebih tinggi
- 📦 **npm** atau **yarn** package manager
- 🌐 **Browser modern** (Chrome, Firefox, Safari, Edge)

## 🚀 Instalasi & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd Sistem-Absensi
```

### 2. Setup Backend
```bash
cd backend
npm install
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

### 4. Jalankan Backend
```bash
cd backend
node server.js
```
Server akan berjalan di `http://localhost:5000`

### 5. Jalankan Frontend
```bash
cd frontend
npm run dev
```
Frontend akan berjalan di `http://localhost:5173`

## 🎯 Cara Penggunaan

### Login Default
- **Admin**: `admin@company.com` / `admin123`
- **Employee**: Daftar akun baru atau gunakan akun yang dibuat admin

### Alur Kerja
1. **Admin** login dan mengelola karyawan serta pengaturan
2. **Karyawan** login dan melakukan check-in/check-out
3. Sistem validasi lokasi otomatis berdasarkan radius kantor
4. Admin dapat melihat laporan dan approve cuti

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user baru

### Attendance
- `POST /api/attendance/checkin` - Check-in absensi
- `POST /api/attendance/checkout` - Check-out absensi
- `GET /api/attendance/history` - Riwayat absensi

### Users (Admin Only)
- `GET /api/users` - List semua karyawan
- `POST /api/users` - Tambah karyawan baru
- `PUT /api/users/:id` - Update karyawan
- `DELETE /api/users/:id` - Hapus karyawan

### Leaves
- `GET /api/leaves` - List permintaan cuti
- `POST /api/leaves` - Ajukan cuti baru
- `PUT /api/leaves/:id` - Update status cuti (approve/reject)

### Settings
- `GET /api/settings` - Ambil pengaturan kantor
- `PUT /api/settings` - Update pengaturan kantor

## 📁 Struktur Project

```
Sistem-Absensi/
├── backend/
│   ├── data/           # JSON data files
│   ├── routes/         # API route handlers
│   ├── server.js       # Main server file
│   └── package.json
├── frontend/
│   ├── public/         # Static assets
│   ├── src/
│   │   ├── components/ # React components
│   │   │   ├── admin/     # Admin components
│   │   │   ├── auth/      # Authentication
│   │   │   ├── common/    # Shared components
│   │   │   └── employee/  # Employee components
│   │   ├── context/    # React context
│   │   ├── pages/      # Page components
│   │   ├── utils/      # Utility functions
│   │   └── App.jsx     # Main app component
│   └── package.json
└── README.md
```

## 🤝 Contributing

Kontribusi sangat diterima! Silakan ikuti langkah berikut:

1. Fork project ini
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

- **Developer**: Fahri Muhammadani
- **Email**: fahrimuhammadani123@gmail.com
- **Project Link**: [[Repository URL](https://github.com/muhf-ahri/Web-Absensi3.git)]

---

⭐ **Jika project ini bermanfaat, jangan lupa untuk memberikan star!**

Made with ❤️ using React & Node.js
