const Schedule = require("../models/Schedule");

// ➕ Add Class
const addSchedule = async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    res.status(201).json({ message: "Class added successfully ✅", schedule });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📌 Get All Schedules
const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ day: 1, startTime: 1 });
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get Schedules by Day
const getSchedulesByDay = async (req, res) => {
  try {
    const { day } = req.params;
    const schedules = await Schedule.find({ day }).sort({ startTime: 1 });
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update Class
const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!schedule) return res.status(404).json({ message: "Class not found ❌" });
    res.status(200).json({ message: "Class updated ✅", schedule });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🗑️ Delete Class
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ message: "Class not found ❌" });
    res.status(200).json({ message: "Class deleted ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance } = req.body;
    
    if (!["present", "absent", "pending"].includes(attendance)) {
      return res.status(400).json({ message: "Invalid attendance status" });
    }
    
    const schedule = await Schedule.findByIdAndUpdate(
      id, 
      { attendance }, 
      { new: true }
    );
    
    if (!schedule) return res.status(404).json({ message: "Class not found ❌" });
    
    res.status(200).json({ message: `Attendance marked as ${attendance}`, schedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addSchedule,
  getSchedules,
  getSchedulesByDay,
  updateSchedule,
  deleteSchedule,
  markAttendance,
};
