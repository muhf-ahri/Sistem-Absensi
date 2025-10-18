const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Simple middleware untuk check admin (DEMO ONLY - dalam real app gunakan JWT)
const isAdmin = (req, res, next) => {
    // Untuk demo, kita bypass dulu authentication
    // Dalam implementasi real, ini akan dicek dari JWT token
    console.log('⚠️  ADMIN CHECK: Bypassing for demo');
    next();
    
    // Kode asli (akan diimplementasi nanti):
    // const token = req.headers.authorization?.replace('Bearer ', '');
    // if (!token) {
    //     return res.status(401).json({ error: 'Token tidak valid' });
    // }
    // // Verify token dan cek role
    // // Jika role !== 'admin', return 403
    // next();
};

// Get all users (admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user (admin only)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, position, role } = req.body;

        // Check if email already exists (for other users)
        const existingUser = await User.findOne({ email, _id: { $ne: id } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email sudah digunakan' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name, email, position, role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        res.json({ message: 'User berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset password (admin only)
router.post('/:id/reset-password', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { password: hashedPassword },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        res.json({ message: 'Password berhasil direset' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile (by user themselves)
router.put('/profile/update', async (req, res) => {
    try {
        const { userId, name, email, position } = req.body;

        // Check if email already exists (for other users)
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email sudah digunakan' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, email, position },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        res.json({
            message: 'Profile berhasil diupdate',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password (by user themselves)
router.put('/profile/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Password saat ini salah' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password berhasil diubah' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;