const Budget = require('../models/BudgetLimit');
const Transaction = require('../models/Transaction');

// Get all budgets for user
exports.getBudgets = async (req, res) => {
  try {
    const { userId } = req.params;
    const budgets = await Budget.find({ userId: userId });
    
    // Get current spending for each budget category
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const spending = await Transaction.aggregate([
          {
            $match: {
              userId: userId,
              type: 'expense',
              category: budget.category,
              date: { $gte: startOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const spent = spending[0]?.total || 0;
        const percentage = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;

        return {
          ...budget.toObject(),
          spent,
          percentage,
          remaining: budget.limit - spent,
          status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
        };
      })
    );

    res.json(budgetsWithSpending);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error fetching budgets' });
  }
};

// Create or update budget
exports.saveBudget = async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, limit, period = 'monthly' } = req.body;

    // Validation
    if (!category || !limit) {
      return res.status(400).json({ message: 'Please provide category and limit' });
    }

    if (limit <= 0) {
      return res.status(400).json({ message: 'Limit must be a positive number' });
    }

    let budget = await Budget.findOne({
      userId: userId,
      category
    });

    if (budget) {
      budget.limit = limit;
      budget.period = period;
    } else {
      budget = new Budget({
        userId: userId,
        category,
        limit,
        period
      });
    }

    await budget.save();
    res.json({
      message: 'Budget saved successfully',
      budget
    });
  } catch (error) {
    console.error('Save budget error:', error);
    res.status(500).json({ message: 'Server error saving budget' });
  }
};

// Delete budget
exports.deleteBudget = async (req, res) => {
  try {
    const { userId, budgetId } = req.params;

    const budget = await Budget.findOneAndDelete({
      _id: budgetId,
      user: userId
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error deleting budget' });
  }
};

// Get budget alerts
exports.getBudgetAlerts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { alertThreshold = 80 } = req.query;
    
    const budgets = await Budget.find({ user: userId });
    const alerts = [];

    for (const budget of budgets) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const spending = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            category: budget.category,
            date: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const spent = spending[0]?.total || 0;
      const percentage = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;

      if (percentage >= alertThreshold) {
        alerts.push({
          category: budget.category,
          spent,
          limit: budget.limit,
          percentage,
          message: percentage >= 100 
            ? `You've exceeded your ${budget.category} budget by $${(spent - budget.limit).toFixed(2)}`
            : `You've used ${percentage}% of your ${budget.category} budget`
        });
      }
    }

    res.json(alerts);
  } catch (error) {
    console.error('Get budget alerts error:', error);
    res.status(500).json({ message: 'Server error fetching budget alerts' });
  }
};