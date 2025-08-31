const express = require("express");
const router = express.Router();
const {
  addSchedule,
  getSchedules,
  getSchedulesByDay,
  updateSchedule,
  deleteSchedule,
  markAttendance
} = require("../controllers/scheduleController");

// Routes
router.post("/add", addSchedule);             
router.get("/", getSchedules);               
router.get("/:day", getSchedulesByDay);       
router.put("/:id", updateSchedule);           
router.delete("/:id", deleteSchedule);   
router.patch("/:id/attendance", markAttendance);  

module.exports = router;
