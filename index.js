const express = require("express");
const connectDB = require("./config/db");
const cors = require('cors')
require('dotenv').config()
connectDB();  
const studentRoutes = require("./routes/studentRoutes");
const scheduleRoutes  = require("./routes/ScheduleRoute")

const app = express();
app.use(cors())
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.send("API is running & MongoDB Connected ✅");
});
app.use("/students", studentRoutes);
app.use("/schedules", scheduleRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port http://localhost:${PORT}`));
