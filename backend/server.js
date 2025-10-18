require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');

const User = require('./models/User');
const Settings = require('./models/Settings');

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const usersRoutes = require('./routes/users');
const leavesRoutes = require('./routes/leaves');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 9999;

// Connect to MongoDB and initialize data
const startServer = async () => {
    try {
        await connectDB();
        console.log('Database connected successfully');

        // Initialize default data after connection
        await initializeDefaultData();

        // 🔥 FIX CORS - Update dengan config yang lebih komprehensif
        const corsOptions = {
            origin: function (origin, callback) {
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin) return callback(null, true);
                
                // Allow all localhost origins and common dev ports
                const allowedOrigins = [
                    'http://localhost:5173',
                    'http://127.0.0.1:5173',
                    'http://localhost:3000',
                    'http://127.0.0.1:3000',
                    'http://localhost:8080',
                    'http://127.0.0.1:8080'
                ];
                
                if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
                    return callback(null, true);
                }
                
                // Untuk production, tambah domain Anda di sini
                if (process.env.NODE_ENV === 'production') {
                    const productionDomains = [
                        'https://your-frontend-domain.vercel.app',
                        'https://your-app.herokuapp.com'
                        // Tambahkan domain production Anda di sini
                    ];
                    if (productionDomains.includes(origin)) {
                        return callback(null, true);
                    }
                }
                
                return callback(null, true); // Temporary allow all in development
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Headers'],
            optionsSuccessStatus: 200
        };

        app.use(cors(corsOptions));

        // 🔥 Handle preflight requests explicitly
        app.options('*', cors(corsOptions));

        // Body parsing middleware
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // Logging middleware
        app.use((req, res, next) => {
            console.log(`📨 ${req.method} ${req.path} - Origin: ${req.headers.origin} - ${new Date().toISOString()}`);
            next();
        });

        // Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/attendance', attendanceRoutes);
        app.use('/api/users', usersRoutes);
        app.use('/api/leaves', leavesRoutes);
        app.use('/api/settings', settingsRoutes);

        // Test route untuk CORS
        app.get('/api/test-cors', (req, res) => {
            res.json({ 
                message: 'CORS test successful!',
                timestamp: new Date().toISOString(),
                origin: req.headers.origin
            });
        });

        // Serve static files in production
        if (process.env.NODE_ENV === 'production') {
            app.use(express.static(path.join(__dirname, '../frontend/dist')));
            
            app.get('*', (req, res) => {
                res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
            });
        }

        // Default route
        app.get('/', (req, res) => {
            res.json({ 
                message: 'Absensi Karyawan API',
                version: '1.0.0',
                status: 'Running',
                environment: process.env.NODE_ENV || 'development',
                cors: 'Enabled'
            });
        });

        // Health check
        app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'OK',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                database: 'Connected',
                cors: 'Enabled'
            });
        });

        // Error handling middleware
        app.use((error, req, res, next) => {
            console.error('Error:', error);
            res.status(500).json({ 
                message: 'Internal Server Error',
                error: process.env.NODE_ENV === 'production' ? {} : error.message
            });
        });

        // 404 handler
        app.use('*', (req, res) => {
            res.status(404).json({ 
                message: 'Route not found',
                path: req.originalUrl,
                method: req.method
            });
        });

        app.listen(PORT, () => {
            console.log(`🚀 Server berjalan di port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 CORS Enabled for:`);
            console.log(`   - http://localhost:5173`);
            console.log(`   - http://127.0.0.1:5173`);
            console.log(`   - http://localhost:3000`);
            console.log(`   - And other localhost origins`);
            console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🧪 CORS Test: http://localhost:${PORT}/api/test-cors`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Initialize default data
const initializeDefaultData = async () => {
    try {
        // Check if admin user exists
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);

            const defaultAdmin = new User({
                name: 'Administrator',
                email: 'admin@company.com',
                password: hashedPassword,
                position: 'System Administrator',
                role: 'admin'
            });

            await defaultAdmin.save();
            console.log('Default admin user created');
        }

        // Check if settings exist
        const settingsExist = await Settings.findOne();
        if (!settingsExist) {
            const defaultSettings = new Settings();
            await defaultSettings.save();
            console.log('Default settings created');
        }
    } catch (error) {
        console.error('Error initializing default data:', error);
    }
};

startServer();