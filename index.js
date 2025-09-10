const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3001;

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@webdevwithraseldb.abql54r.mongodb.net/?retryWrites=true&w=majority&appName=WebDevWithRaselDB`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("WebDevWithRaselDB");
    const scheduleCollection = database.collection("schedules");
    const transactionCollection = database.collection("transactions");
    const budgetCollection = database.collection("budgets");
    const goalsCollection = database.collection("goals");
    const studySessionsCollection = database.collection("studysessions");
    const studentCollection = database.collection("students");

    app.post("/students/add", async (req, res) => {
      try {
        const student = { ...req.body, user_role: "student" };
        const result = await studentCollection.insertOne(student);
        res
          .status(201)
          .json({ message: "Student added successfully ✅", student: result });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    });

    // Get All Students
    app.get("/students", async (req, res) => {
      const { email } = req.query;

      if (!email) {
        return res
          .status(400)
          .json({ message: "Email query parameter is required" });
      }

      try {
        const student = await studentCollection.findOne({ email });

        if (!student) {
          return res.status(404).json({ message: "Student not found" });
        }

        res.status(200).json(student);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // Update Student
    app.put("/students/:id", async (req, res) => {
      try {
        const student = await studentCollection.findOneAndUpdate(
          { _id: new ObjectId(req.params.id) },
          { $set: req.body },
          { returnDocument: "after" }
        );
        if (!student.value)
          return res.status(404).json({ message: "Student not found" });
        res
          .status(200)
          .json({ message: "Student updated ✅", student: student.value });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    });

    // Delete Student
    app.delete("/students/:id", async (req, res) => {
      try {
        const result = await studentCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        if (result.deletedCount === 0)
          return res.status(404).json({ message: "Student not found" });
        res.status(200).json({ message: "Student deleted ✅" });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //  Schedule Routes
    app.post("/schedule/add", async (req, res) => {
      try {
        const schedule = req.body;
        const result = await scheduleCollection.insertOne(schedule);
        res
          .status(201)
          .json({ message: "Class added successfully ✅", schedule: result });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    });

    //  Get All Schedules by Email
    app.get("/schedule/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const filter = { createdBy: email };
        const schedules = await scheduleCollection
          .find(filter)
          .sort({ day: 1, startTime: 1 })
          .toArray();
        res.status(200).json(schedules);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //  Get Schedules by Day
    app.get("/schedule/day/:day", async (req, res) => {
      try {
        const { day } = req.params;
        const schedules = await scheduleCollection
          .find({ day })
          .sort({ startTime: 1 })
          .toArray();
        res.status(200).json(schedules);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //  Update Class
    app.put("/schedule/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updatedSchedule = req.body;
        const result = await scheduleCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updatedSchedule },
          { returnDocument: "after" }
        );
        if (!result.value)
          return res.status(404).json({ message: "Class not found ❌" });
        res
          .status(200)
          .json({ message: "Class updated ✅", schedule: result.value });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    });

    //Delete Class
    app.delete("/schedule/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await scheduleCollection.findOneAndDelete({
          _id: new ObjectId(id),
        });
        if (!result.value)
          return res.status(404).json({ message: "Class not found ❌" });
        res.status(200).json({ message: "Class deleted ✅" });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //  Mark Attendance
    app.patch("/schedule/:id/attendance", async (req, res) => {
      try {
        const { id } = req.params;
        const { attendance } = req.body;

        if (!["present", "absent", "pending"].includes(attendance)) {
          return res.status(400).json({ message: "Invalid attendance status" });
        }

        const result = await scheduleCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { attendance } },
          { returnDocument: "after" }
        );

        if (!result.value)
          return res.status(404).json({ message: "Class not found ❌" });

        res.status(200).json({
          message: `Attendance marked as ${attendance}`,
          schedule: result.value,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //  Budget Routes
    app.get("/budget/:userId", async (req, res) => {
      try {
        const { userId } = req.params;

        const budgets = await budgetCollection.find({ userId }).toArray();

        const budgetsWithSpending = await Promise.all(
          budgets.map(async (budget) => {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const spending = await transactionCollection
              .aggregate([
                {
                  $match: {
                    userId,
                    type: "expense",
                    category: budget.category,
                    date: { $gte: startOfMonth },
                  },
                },
                { $group: { _id: null, total: { $sum: "$amount" } } },
              ])
              .toArray();

            const spent = spending[0]?.total || 0;
            const percentage =
              budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;

            return {
              ...budget,
              spent,
              percentage,
              remaining: budget.limit - spent,
              status:
                percentage > 100
                  ? "over"
                  : percentage > 80
                  ? "warning"
                  : "good",
            };
          })
        );

        res.json(budgetsWithSpending);
      } catch (error) {
        console.error("Get budgets error:", error);
        res.status(500).json({ message: "Server error fetching budgets" });
      }
    });

    // Create or update budget
    app.post("/budget/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        const { category, limit, period = "monthly" } = req.body;

        if (!category || !limit || limit <= 0) {
          return res.status(400).json({
            message: "Please provide a valid category and positive limit",
          });
        }

        let budget = await budgetCollection.findOne({ userId, category });

        if (budget) {
          await budgetCollection.updateOne(
            { _id: budget._id },
            { $set: { limit, period } }
          );
          budget = await budgetCollection.findOne({ _id: budget._id });
        } else {
          const result = await budgetCollection.insertOne({
            userId,
            category,
            limit,
            period,
          });
          budget = { _id: result.insertedId, userId, category, limit, period };
        }

        res.json({ message: "Budget saved successfully", budget });
      } catch (error) {
        console.error("Save budget error:", error);
        res.status(500).json({ message: "Server error saving budget" });
      }
    });

    // Delete a budget
    app.delete("/budget/:userId/:budgetId", async (req, res) => {
      try {
        const { userId, budgetId } = req.params;

        const result = await budgetCollection.findOneAndDelete({
          _id: new ObjectId(budgetId),
          userId,
        });

        if (!result.value) {
          return res.status(404).json({ message: "Budget not found" });
        }

        res.json({ message: "Budget deleted successfully" });
      } catch (error) {
        console.error("Delete budget error:", error);
        res.status(500).json({ message: "Server error deleting budget" });
      }
    });

    // Get budget alerts
    app.get("/budget/:userId/alerts", async (req, res) => {
      try {
        const { userId } = req.params;
        const alertThreshold = parseInt(req.query.alertThreshold) || 80;

        const budgets = await budgetCollection.find({ userId }).toArray();
        const alerts = [];

        for (const budget of budgets) {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const spending = await transactionCollection
            .aggregate([
              {
                $match: {
                  userId,
                  type: "expense",
                  category: budget.category,
                  date: { $gte: startOfMonth },
                },
              },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ])
            .toArray();

          const spent = spending[0]?.total || 0;
          const percentage =
            budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;

          if (percentage >= alertThreshold) {
            alerts.push({
              category: budget.category,
              spent,
              limit: budget.limit,
              percentage,
              message:
                percentage >= 100
                  ? `You've exceeded your ${budget.category} budget by $${(
                      spent - budget.limit
                    ).toFixed(2)}`
                  : `You've used ${percentage}% of your ${budget.category} budget`,
            });
          }
        }

        res.json(alerts);
      } catch (error) {
        console.error("Get budget alerts error:", error);
        res
          .status(500)
          .json({ message: "Server error fetching budget alerts" });
      }
    });

    app.get("/transactions/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        const {
          page = 1,
          limit = 10,
          type,
          category,
          startDate,
          endDate,
        } = req.query;

        const filter = { userId };
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (startDate || endDate) filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);

        const total = await transactionCollection.countDocuments(filter);
        const transactions = await transactionCollection
          .find(filter)
          .sort({ date: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit))
          .toArray();

        res.json({
          transactions,
          totalPages: Math.ceil(total / limit),
          currentPage: Number(page),
          total,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching transactions" });
      }
    });

    // Get transaction stats
    app.get("/transactions/:userId/stats", async (req, res) => {
      try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        const matchStage = { userId };
        if (startDate || endDate) matchStage.date = {};
        if (startDate) matchStage.date.$gte = new Date(startDate);
        if (endDate) matchStage.date.$lte = new Date(endDate);

        const stats = await transactionCollection
          .aggregate([
            { $match: matchStage },
            {
              $group: {
                _id: "$type",
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ])
          .toArray();

        const income = stats.find((s) => s._id === "income")?.total || 0;
        const expenses = stats.find((s) => s._id === "expense")?.total || 0;
        const balance = income - expenses;

        const categoryStats = await transactionCollection
          .aggregate([
            { $match: { ...matchStage, type: "expense" } },
            {
              $group: {
                _id: "$category",
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { total: -1 } },
          ])
          .toArray();

        res.json({
          totalIncome: income,
          totalExpenses: expenses,
          balance,
          categoryBreakdown: categoryStats,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching stats" });
      }
    });

    // Add a transaction
    app.post("/transactions/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        const { type, category, amount, date, description } = req.body;

        if (!type || !category || !amount || !date) {
          return res
            .status(400)
            .json({ message: "Please provide all required fields" });
        }
        if (!["income", "expense"].includes(type)) {
          return res
            .status(400)
            .json({ message: "Type must be income or expense" });
        }
        if (amount <= 0) {
          return res.status(400).json({ message: "Amount must be positive" });
        }

        const transaction = {
          userId,
          type,
          category,
          amount,
          date: new Date(date),
          description: description || "",
        };

        const result = await transactionCollection.insertOne(transaction);
        res.status(201).json({
          message: "Transaction added",
          transaction: { ...transaction, _id: result.insertedId },
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error adding transaction" });
      }
    });

    // Update a transaction
    app.put("/transactions/:userId/:transactionId", async (req, res) => {
      try {
        const { userId, transactionId } = req.params;
        const updateData = req.body;

        const result = await transactionCollection.findOneAndUpdate(
          { _id: new ObjectId(transactionId), userId },
          { $set: updateData },
          { returnDocument: "after" }
        );

        if (!result.value)
          return res.status(404).json({ message: "Transaction not found" });
        res.json({ message: "Transaction updated", transaction: result.value });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error updating transaction" });
      }
    });

    // Delete a transaction
    app.delete("/transactions/:userId/:transactionId", async (req, res) => {
      try {
        const { userId, transactionId } = req.params;

        const result = await transactionCollection.findOneAndDelete({
          _id: new ObjectId(transactionId),
          userId,
        });
        if (!result.value)
          return res.status(404).json({ message: "Transaction not found" });

        res.json({ message: "Transaction deleted" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error deleting transaction" });
      }
    });
    app.get("/goals/:userEmail", async (req, res) => {
      try {
        const { userEmail } = req.params;
        const { page = 1, limit = 10, completed, priority } = req.query;

        const filter = { userEmail };
        if (completed !== undefined) filter.completed = completed === "true";
        if (priority) filter.priority = priority;

        const total = await goalsCollection.countDocuments(filter);
        const goals = await goalsCollection
          .find(filter)
          .sort({ deadline: 1, priority: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit))
          .toArray();

        res.json({
          goals,
          totalPages: Math.ceil(total / limit),
          currentPage: Number(page),
          total,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching goals" });
      }
    });

    // Create a new goal
    app.post("/goals", async (req, res) => {
      try {
        const { title, subject, description, deadline, priority, userEmail } =
          req.body;

        if (!title || !subject || !deadline || !userEmail) {
          return res.status(400).json({
            message: "Title, subject, deadline, and userEmail are required",
          });
        }

        const goal = {
          title,
          subject,
          description: description || "",
          deadline: new Date(deadline),
          priority: priority || "medium",
          userEmail,
          completed: false,
          progress: 0,
        };

        const result = await goalsCollection.insertOne(goal);
        res.status(201).json({
          message: "Goal created",
          goal: { ...goal, _id: result.insertedId },
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error creating goal" });
      }
    });

    // Update a goal
    app.put("/goals/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        const result = await goalsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updates },
          { returnDocument: "after" }
        );

        if (!result.value)
          return res.status(404).json({ message: "Goal not found" });
        res.json({ message: "Goal updated", goal: result.value });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error updating goal" });
      }
    });

    // Delete a goal
    app.delete("/goals/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await goalsCollection.findOneAndDelete({
          _id: new ObjectId(id),
        });
        if (!result.value)
          return res.status(404).json({ message: "Goal not found" });

        res.json({ message: "Goal deleted" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error deleting goal" });
      }
    });

    // Toggle goal completion
    app.patch("/goals/:id/toggle", async (req, res) => {
      try {
        const { id } = req.params;
        const goal = await goalsCollection.findOne({ _id: new ObjectId(id) });
        if (!goal) return res.status(404).json({ message: "Goal not found" });

        const updated = await goalsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { completed: !goal.completed } },
          { returnDocument: "after" }
        );

        res.json({
          message: `Goal marked as ${
            updated.value.completed ? "completed" : "incomplete"
          }`,
          goal: updated.value,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error updating goal" });
      }
    });

    // Get goals statistics
    app.get("/goals/:userEmail/stats", async (req, res) => {
      try {
        const { userEmail } = req.params;

        const stats = await goalsCollection
          .aggregate([
            { $match: { userEmail } },
            {
              $group: {
                _id: "$subject",
                total: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] },
                },
                averageProgress: { $avg: "$progress" },
              },
            },
          ])
          .toArray();

        const totalGoals = await goalsCollection.countDocuments({ userEmail });
        const completedGoals = await goalsCollection.countDocuments({
          userEmail,
          completed: true,
        });
        const progressPercentage =
          totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        res.json({
          bySubject: stats,
          totalGoals,
          completedGoals,
          progressPercentage,
        });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .json({ message: "Server error fetching goals statistics" });
      }
    });
    app.post("/goals", async (req, res) => {
      try {
        const { title, subject, description, deadline, priority, userEmail } =
          req.body;

        if (!title || !subject || !deadline || !userEmail) {
          return res.status(400).json({
            message: "Title, subject, deadline, and userEmail are required",
          });
        }

        const goal = {
          title,
          subject,
          description: description || "",
          deadline: new Date(deadline),
          priority: priority || "medium",
          userEmail,
          completed: false,
          progress: 0,
          createdAt: new Date(),
        };

        const result = await goalsCollection.insertOne(goal);
        res.status(201).json({
          message: "Goal created",
          goal: { ...goal, _id: result.insertedId },
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error creating goal" });
      }
    });

    // Get goals by user email
    app.get("/goals/:userEmail", async (req, res) => {
      try {
        const { userEmail } = req.params;
        const goals = await goalsCollection
          .find({ userEmail })
          .sort({ createdAt: -1 })
          .toArray();
        res.json(goals);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching goals" });
      }
    });

    // Update a goal
    app.put("/goals/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        const result = await goalsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updates },
          { returnDocument: "after" }
        );

        if (!result.value)
          return res.status(404).json({ message: "Goal not found" });
        res.json({ message: "Goal updated", goal: result.value });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error updating goal" });
      }
    });

    // Delete a goal
    app.delete("/goals/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await goalsCollection.findOneAndDelete({
          _id: new ObjectId(id),
        });
        if (!result.value)
          return res.status(404).json({ message: "Goal not found" });

        res.json({ message: "Goal deleted" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error deleting goal" });
      }
    });

    // Toggle goal completion
    app.patch("/goals/:id/toggle", async (req, res) => {
      try {
        const { id } = req.params;
        const goal = await goalsCollection.findOne({ _id: new ObjectId(id) });
        if (!goal) return res.status(404).json({ message: "Goal not found" });

        const updated = await goalsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { completed: !goal.completed } },
          { returnDocument: "after" }
        );

        res.json({
          message: `Goal marked as ${
            updated.value.completed ? "completed" : "incomplete"
          }`,
          goal: updated.value,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error updating goal" });
      }
    });

    // Get goals statistics
    app.get("/goals/:userEmail/stats", async (req, res) => {
      try {
        const { userEmail } = req.params;

        const stats = await goalsCollection
          .aggregate([
            { $match: { userEmail } },
            {
              $group: {
                _id: "$subject",
                total: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] },
                },
                averageProgress: { $avg: "$progress" },
              },
            },
          ])
          .toArray();

        const totalGoals = await goalsCollection.countDocuments({ userEmail });
        const completedGoals = await goalsCollection.countDocuments({
          userEmail,
          completed: true,
        });
        const progressPercentage =
          totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        res.json({
          bySubject: stats,
          totalGoals,
          completedGoals,
          progressPercentage,
        });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .json({ message: "Server error fetching goals statistics" });
      }
    });

    // 📚 Study Session Routes
    // Get all study sessions for user
    app.get("/study-sessions/:userEmail", async (req, res) => {
      try {
        const { userEmail } = req.params;
        const { page = 1, limit = 10, completed, subject, date } = req.query;

        // Build filter object
        const filter = { userEmail };
        if (completed !== undefined) filter.completed = completed === "true";
        if (subject) filter.subject = subject;
        if (date) filter.date = new Date(date);

        const sessions = await studySessionsCollection
          .find(filter)
          .sort({ date: 1, startTime: 1 })
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit))
          .toArray();

        const total = await studySessionsCollection.countDocuments(filter);

        res.json({
          sessions,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          total,
        });
      } catch (error) {
        console.error("Get sessions error:", error);
        res
          .status(500)
          .json({ message: "Server error fetching study sessions" });
      }
    });

    // Create new study session
    app.post("/study-sessions", async (req, res) => {
      try {
        const { subject, topic, date, startTime, duration, notes, userEmail } =
          req.body;

        // Validation
        if (
          !subject ||
          !topic ||
          !date ||
          !startTime ||
          !duration ||
          !userEmail
        ) {
          return res.status(400).json({
            message:
              "Subject, topic, date, startTime, duration, and userEmail are required",
          });
        }

        const session = {
          subject,
          topic,
          date: new Date(date),
          startTime,
          duration: parseInt(duration),
          notes: notes || "",
          userEmail,
          completed: false,
          createdAt: new Date(),
        };

        const result = await studySessionsCollection.insertOne(session);

        res.status(201).json({
          message: "Study session created successfully",
          session: { ...session, _id: result.insertedId },
        });
      } catch (error) {
        console.error("Create session error:", error);
        res
          .status(500)
          .json({ message: "Server error creating study session" });
      }
    });

    // Update study session
    app.put("/study-sessions/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        // Convert date if provided
        if (updates.date) {
          updates.date = new Date(updates.date);
        }
        if (updates.duration) {
          updates.duration = parseInt(updates.duration);
        }

        const result = await studySessionsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updates },
          { returnDocument: "after" }
        );

        if (!result.value) {
          return res.status(404).json({ message: "Study session not found" });
        }

        res.json({
          message: "Study session updated successfully",
          session: result.value,
        });
      } catch (error) {
        console.error("Update session error:", error);
        res
          .status(500)
          .json({ message: "Server error updating study session" });
      }
    });

    // Delete study session
    app.delete("/study-sessions/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await studySessionsCollection.findOneAndDelete({
          _id: new ObjectId(id),
        });

        if (!result.value) {
          return res.status(404).json({ message: "Study session not found" });
        }

        res.json({ message: "Study session deleted successfully" });
      } catch (error) {
        console.error("Delete session error:", error);
        res
          .status(500)
          .json({ message: "Server error deleting study session" });
      }
    });

    // Toggle session completion
    app.patch("/study-sessions/:id/toggle", async (req, res) => {
      try {
        const { id } = req.params;

        const session = await studySessionsCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!session) {
          return res.status(404).json({ message: "Study session not found" });
        }

        const result = await studySessionsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { completed: !session.completed } },
          { returnDocument: "after" }
        );

        res.json({
          message: `Study session marked as ${
            result.value.completed ? "completed" : "incomplete"
          }`,
          session: result.value,
        });
      } catch (error) {
        console.error("Toggle session completion error:", error);
        res
          .status(500)
          .json({ message: "Server error updating study session" });
      }
    });

    // Get session statistics
    app.get("/study-sessions/:userEmail/stats", async (req, res) => {
      try {
        const { userEmail } = req.params;
        const { startDate, endDate } = req.query;

        const matchStage = { userEmail };
        if (startDate || endDate) {
          matchStage.date = {};
          if (startDate) matchStage.date.$gte = new Date(startDate);
          if (endDate) matchStage.date.$lte = new Date(endDate);
        }

        const stats = await studySessionsCollection
          .aggregate([
            { $match: matchStage },
            {
              $group: {
                _id: "$subject",
                totalSessions: { $sum: 1 },
                totalHours: { $sum: "$duration" },
                completedSessions: {
                  $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] },
                },
              },
            },
          ])
          .toArray();

        const totalSessions = await studySessionsCollection.countDocuments(
          matchStage
        );

        const totalHoursResult = await studySessionsCollection
          .aggregate([
            { $match: matchStage },
            { $group: { _id: null, total: { $sum: "$duration" } } },
          ])
          .toArray();

        const totalHours = totalHoursResult[0]?.total || 0;

        res.json({
          bySubject: stats,
          totalSessions,
          totalHours,
        });
      } catch (error) {
        console.error("Get session stats error:", error);
        res
          .status(500)
          .json({ message: "Server error fetching session statistics" });
      }
    });

    // Root endpoint
    app.get("/", (req, res) => {
      res.send("Class Scheduler and Budget Tracker API is running ✅");
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} 🚀`);
    });
  } catch (err) {}
}

run().catch(console.dir);
