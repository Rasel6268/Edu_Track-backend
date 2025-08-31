const mongoose = require("mongoose");


const connectDB = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@webdevwithraseldb.abql54r.mongodb.net/WebDevWithRaselDB`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1); // Stop the app if DB connection fails
  }
};

module.exports = connectDB;
