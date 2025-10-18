const express = require("express");
const mongoose = require("mongoose"); // TAMBAHKAN INI
const Leave = require("../models/Leave");
const User = require("../models/User");

const router = express.Router();

// Simple middleware untuk check admin (DEMO ONLY - dalam real app gunakan JWT)
const isAdmin = (req, res, next) => {
  // Untuk demo, kita bypass dulu authentication
  // Dalam implementasi real, ini akan dicek dari JWT token
  console.log("⚠️  ADMIN CHECK: Bypassing for demo");
  next();
};

// Apply for leave
router.post("/apply", async (req, res) => {
  try {
    const { userId, startDate, endDate, reason, type } = req.body;

    const newLeave = new Leave({
      userId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      type: type || "cuti",
    });

    await newLeave.save();

    res.json({ message: "Pengajuan cuti berhasil dikirim", leave: newLeave });
  } catch (error) {
    console.error("Apply leave error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user's leaves
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const userLeaves = await Leave.find({ userId }).sort({ appliedAt: -1 });

    res.json(userLeaves);
  } catch (error) {
    console.error("Get user leaves error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all leaves (admin only)
router.get("/all", isAdmin, async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("userId", "name email position")
      .populate("processedBy", "name")
      .sort({ appliedAt: -1 });

    // Format response yang KONSISTEN
    const leavesWithUserInfo = leaves.map((leave) => ({
      _id: leave._id,
      id: leave._id.toString(), // Convert to string untuk konsistensi
      userId: leave.userId._id,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      type: leave.type,
      status: leave.status,
      appliedAt: leave.appliedAt,
      processedAt: leave.processedAt,
      processedBy: leave.processedBy ? leave.processedBy._id : null,
      userName: leave.userId.name,
      userEmail: leave.userId.email,
      userPosition: leave.userId.position,
      processedByName: leave.processedBy ? leave.processedBy.name : null,
    }));

    res.json(leavesWithUserInfo);
  } catch (error) {
    console.error("Get all leaves error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update leave status (admin only) - FIXED VERSION
router.put("/:id/status", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, processedBy } = req.body;

    console.log("Updating leave status:", { id, status, processedBy });

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Status tidak valid. Harus approved atau rejected" });
    }

    // Validasi ObjectId - FIX: gunakan mongoose.Types.ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID pengajuan cuti tidak valid" });
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      {
        status,
        processedAt: new Date(),
        processedBy: processedBy || null, // Gunakan null jika tidak ada
      },
      { new: true }
    )
      .populate("userId", "name email position")
      .populate("processedBy", "name");

    if (!updatedLeave) {
      return res.status(404).json({ error: "Pengajuan cuti tidak ditemukan" });
    }

    console.log("Leave status updated successfully:", updatedLeave._id);

    // Format response
    const response = {
      _id: updatedLeave._id,
      id: updatedLeave._id.toString(),
      userId: updatedLeave.userId._id,
      startDate: updatedLeave.startDate,
      endDate: updatedLeave.endDate,
      reason: updatedLeave.reason,
      type: updatedLeave.type,
      status: updatedLeave.status,
      appliedAt: updatedLeave.appliedAt,
      processedAt: updatedLeave.processedAt,
      processedBy: updatedLeave.processedBy
        ? updatedLeave.processedBy._id
        : null,
      userName: updatedLeave.userId.name,
      userEmail: updatedLeave.userId.email,
      userPosition: updatedLeave.userId.position,
      processedByName: updatedLeave.processedBy
        ? updatedLeave.processedBy.name
        : null,
    };

    res.json({
      message: `Pengajuan cuti berhasil ${
        status === "approved" ? "disetujui" : "ditolak"
      }`,
      leave: response,
    });
  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

// Get leave statistics
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userLeaves = await Leave.find({ userId });
    const currentYear = new Date().getFullYear();

    const stats = {
      total: userLeaves.length,
      approved: userLeaves.filter((leave) => leave.status === "approved")
        .length,
      pending: userLeaves.filter((leave) => leave.status === "pending").length,
      rejected: userLeaves.filter((leave) => leave.status === "rejected")
        .length,
      thisYear: userLeaves.filter((leave) => {
        const leaveYear = new Date(leave.appliedAt).getFullYear();
        return leaveYear === currentYear && leave.status === "approved";
      }).length,
    };

    res.json(stats);
  } catch (error) {
    console.error("Get leave stats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
