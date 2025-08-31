const express = require("express");
const connectDB = require("./config/db");
const cors = require('cors')
require('dotenv').config()
connectDB();  
const studentRoutes = require("./routes/studentRoutes");
const scheduleRoutes  = require("./routes/ScheduleRoute")
const transactions = require('./routes/transactions')
const budgetLimits = require('./routes/budgetLimits')
const goalRoutes = require('./routes/goals');
const sessionRoutes = require('./routes/sessions');

const app = express();
app.use(cors())
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.send("API is running & MongoDB Connected ✅");
});
app.use("/students", studentRoutes);
app.use("/schedules", scheduleRoutes);
app.use('/api/transactions', transactions);
app.use('/api/budgets', budgetLimits);
app.use('/api/goals', goalRoutes);
app.use('/api/sessions', sessionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port http://localhost:${PORT}`));
