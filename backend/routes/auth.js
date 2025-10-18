const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_SECRET_TOKEN = 'ADMIN123456'; // Token rahasia untuk jadi admin

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, position, adminToken } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email sudah terdaftar' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Determine role based on admin token
        let role = 'employee';
        if (adminToken && adminToken === ADMIN_SECRET_TOKEN) {
            role = 'admin';
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            position: position || 'Karyawan',
            role: role
        });

        await newUser.save();

        // Generate token
        const token = jwt.sign(
            { userId: newUser._id, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                position: newUser.position
            },
            message: role === 'admin' ? 'Admin account created successfully!' : 'Account created successfully!'
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Email atau password salah' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Email atau password salah' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                position: user.position
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;