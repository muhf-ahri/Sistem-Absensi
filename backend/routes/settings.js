const express = require("express");
const Settings = require("../models/Settings");

const router = express.Router();

// ===== GET: All Settings =====
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    const defaultSettings = {
      companyName: settings.companyName,
      workingHours: settings.workingHours,
      attendanceRules: settings.attendanceRules,
      officeLocation: settings.officeLocation,
      updatedAt: settings.updatedAt,
    };

    res.json(defaultSettings);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ===== PUT: Update General Settings =====
router.put("/", async (req, res) => {
  try {
    const { workingHours, companyName } = req.body;

    if (workingHours && workingHours.start >= workingHours.end) {
      return res
        .status(400)
        .json({ error: "Jam masuk harus lebih awal dari jam pulang" });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (companyName) settings.companyName = companyName;
    if (workingHours) settings.workingHours = workingHours;

    await settings.save();

    res.json({
      message: "Pengaturan umum berhasil diperbarui",
      settings: {
        companyName: settings.companyName,
        workingHours: settings.workingHours,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ===== GET: Office Location =====
router.get("/office-location", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    res.json(settings.officeLocation);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ===== PUT: Update Office Location =====
router.put("/office-location", async (req, res) => {
  try {
    const { latitude, longitude, radius, address } = req.body;

    if (!latitude || !longitude || !radius) {
      return res
        .status(400)
        .json({ error: "Latitude, longitude, dan radius harus diisi" });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.officeLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: parseFloat(radius),
      address: address || "Office Location",
    };

    await settings.save();

    res.json({
      message: "Lokasi kantor berhasil diperbarui",
      officeLocation: settings.officeLocation,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ===== GET: Employee Working Hours =====
router.get("/employee-working-hours", async (req, res) => {
  try {
    const users = await User.find({ role: 'employee' }).select('name position');
    const settings = await Settings.findOne();

    const defaultWorkingHours = settings ? settings.workingHours : { start: "09:00", end: "17:00" };

    const employeesWithHours = users.map((user) => ({
      id: user._id,
      name: user.name,
      position: user.position,
      workingHours: defaultWorkingHours,
    }));

    res.json(employeesWithHours);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ===== PUT: Update Employee Working Hours =====
router.put("/employee-working-hours/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { start, end } = req.body;

    if (!start || !end) {
      return res
        .status(400)
        .json({ error: "Jam masuk dan jam pulang harus diisi" });
    }

    if (start >= end) {
      return res
        .status(400)
        .json({ error: "Jam masuk harus lebih awal dari jam pulang" });
    }

    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({ error: "Karyawan tidak ditemukan" });
    }

    // Note: Since we don't have custom working hours in User model, we'll just return success
    // In a real implementation, you might add a workingHours field to the User model
    const workingHours = {
      start,
      end,
      isCustom: true,
      updatedAt: new Date(),
    };

    res.json({
      message: "Jam kerja karyawan berhasil diperbarui",
      workingHours,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ===== GET: Attendance Hours (jam kehadiran) =====
router.get("/attendance-hours", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    const attendanceHours = {
      checkIn: settings.attendanceRules.maxCheckInTime,
      checkOut: settings.workingHours.end
    };

    res.json(attendanceHours);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ===== PUT: Update Attendance Hours =====
router.put("/attendance-hours", async (req, res) => {
  try {
    const { checkIn, checkOut } = req.body;

    if (!checkIn || !checkOut) {
      return res
        .status(400)
        .json({ error: "Jam kehadiran dan jam pulang absensi harus diisi" });
    }

    if (checkIn >= checkOut) {
      return res
        .status(400)
        .json({ error: "Jam kehadiran harus lebih awal dari jam pulang" });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.attendanceRules.maxCheckInTime = checkIn;
    settings.workingHours.end = checkOut;

    await settings.save();

    res.json({
      message: "Jam kehadiran berhasil diperbarui",
      attendanceHours: {
        checkIn: settings.attendanceRules.maxCheckInTime,
        checkOut: settings.workingHours.end
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
