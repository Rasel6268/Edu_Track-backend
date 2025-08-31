const Transaction = require("../models/Transaction");

// Get all transactions for user
exports.getTransactions = async (req, res) => {
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

    // Build filter object
    const filter = { userId: userId };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ message: "Server error fetching transactions" });
  }
};

// Get transaction statistics
exports.getStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const matchStage = { user: userId };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const income = stats.find((s) => s._id === "income")?.total || 0;
    const expenses = stats.find((s) => s._id === "expense")?.total || 0;
    const balance = income - expenses;

    // Category breakdown
    const categoryStats = await Transaction.aggregate([
      { $match: { ...matchStage, type: "expense" } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({
      totalIncome: income,
      totalExpenses: expenses,
      balance,
      categoryBreakdown: categoryStats,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Server error fetching statistics" });
  }
};

// Add new transaction
exports.addTransaction = async (req, res) => {
  try {
    const { type, category, amount, date, description,userId } = req.body;
    console.log(req.body)

    
    if (!type || !category || !amount || !date) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (type !== "income" && type !== "expense") {
      return res
        .status(400)
        .json({ message: "Type must be income or expense" });
    }

    if (amount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive number" });
    }

    const transaction = new Transaction({
      type,
      category,
      amount,
      date,
      description,
      userId
    });

    await transaction.save();
    res.status(201).json({
      message: "Transaction added successfully",
      transaction,
    });
  } catch (error) {
    console.error("Add transaction error:", error);
    res.status(500).json({ message: "Server error adding transaction" });
  }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
  try {
    const { userId, transactionId } = req.params;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    Object.assign(transaction, req.body);
    await transaction.save();

    res.json({
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({ message: "Server error updating transaction" });
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const { userId, transactionId } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: transactionId,
      user: userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({ message: "Server error deleting transaction" });
  }
};
