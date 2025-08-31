const Goal = require('../models/Goal');

// Get all goals for user
exports.getGoals = async (req, res) => {
    const {userEmail} =req.params
    
  try {
    const { page = 1, limit = 10, completed, priority } = req.query;
    
    // Build filter object
    const filter = { userEmail: userEmail };
    if (completed !== undefined) filter.completed = completed === 'true';
    if (priority) filter.priority = priority;

    const goals = await Goal.find(filter)
      .sort({ deadline: 1, priority: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Goal.countDocuments(filter);

    res.json({
      goals,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Server error fetching goals' });
  }
};

// Create new goal
exports.createGoal = async (req, res) => {

  try {
    const { title, subject, description, deadline, priority,userEmail } = req.body;

    // Validation
    if (!title || !subject || !deadline) {
      return res.status(400).json({ message: 'Title, subject, and deadline are required' });
    }

    const goal = new Goal({
      title,
      subject,
      description,
      deadline,
      priority: priority || 'medium',
      userEmail: userEmail
    });

    await goal.save();
    res.status(201).json({
      message: 'Goal created successfully',
      goal
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Server error creating goal' });
  }
};

// Update goal
exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const goal = await Goal.findOneAndUpdate(
      { _id: id, user: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({
      message: 'Goal updated successfully',
      goal
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Server error updating goal' });
  }
};

// Delete goal
exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findOneAndDelete({
      _id: id,
      user: req.userId
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Server error deleting goal' });
  }
};

// Toggle goal completion
exports.toggleGoalCompletion = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findOne({ _id: id, user: req.userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.completed = !goal.completed;
    await goal.save();

    res.json({
      message: `Goal marked as ${goal.completed ? 'completed' : 'incomplete'}`,
      goal
    });
  } catch (error) {
    console.error('Toggle goal completion error:', error);
    res.status(500).json({ message: 'Server error updating goal' });
  }
};

// Get goals statistics
exports.getGoalsStats = async (req, res) => {
  try {
    const stats = await Goal.aggregate([
      { $match: { user: req.userId } },
      {
        $group: {
          _id: '$subject',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
          },
          averageProgress: { $avg: '$progress' }
        }
      }
    ]);

    const totalGoals = await Goal.countDocuments({ user: req.userId });
    const completedGoals = await Goal.countDocuments({ 
      user: req.userId, 
      completed: true 
    });
    const progressPercentage = totalGoals > 0 ? 
      Math.round((completedGoals / totalGoals) * 100) : 0;

    res.json({
      bySubject: stats,
      totalGoals,
      completedGoals,
      progressPercentage
    });
  } catch (error) {
    console.error('Get goals stats error:', error);
    res.status(500).json({ message: 'Server error fetching goals statistics' });
  }
};