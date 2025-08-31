const StudySession = require('../models/StudySession');

// Get all study sessions for user
exports.getSessions = async (req, res) => {
  const {userEmail} = req.params

  try {
    const { page = 1, limit = 10, completed, subject, date } = req.query;
    
    // Build filter object
    const filter = { userEmail: userEmail };
    if (completed !== undefined) filter.completed = completed === 'true';
    if (subject) filter.subject = subject;
    if (date) filter.date = new Date(date);

    const sessions = await StudySession.find(filter)
      .sort({ date: 1, startTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StudySession.countDocuments(filter);

    res.json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error fetching study sessions' });
  }
};

// Create new study session
exports.createSession = async (req, res) => {
  
  try {
    const { subject, topic, date, startTime, duration, notes,userEmail } = req.body;

    // Validation
    if (!subject || !topic || !date || !startTime || !duration) {
      return res.status(400).json({ message: 'Subject, topic, date, startTime, and duration are required' });
    }

    const session = new StudySession({
      subject,
      topic,
      date,
      startTime,
      duration,
      notes,
      userEmail: userEmail
    });

   await session.save();
    res.status(201).json({
      message: 'Study session created successfully',
      session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error creating study session' });
  }
};

// Update study session
exports.updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const session = await StudySession.findOneAndUpdate(
      { _id: id, user: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    res.json({
      message: 'Study session updated successfully',
      session
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ message: 'Server error updating study session' });
  }
};

// Delete study session
exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await StudySession.findOneAndDelete({
      _id: id,
      user: req.userId
    });

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    res.json({ message: 'Study session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Server error deleting study session' });
  }
};

// Toggle session completion
exports.toggleSessionCompletion = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await StudySession.findOne({ _id: id, user: req.userId });
    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    session.completed = !session.completed;
    await session.save();

    res.json({
      message: `Study session marked as ${session.completed ? 'completed' : 'incomplete'}`,
      session
    });
  } catch (error) {
    console.error('Toggle session completion error:', error);
    res.status(500).json({ message: 'Server error updating study session' });
  }
};

// Get session statistics
exports.getSessionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { user: req.userId };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const stats = await StudySession.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$subject',
          totalSessions: { $sum: 1 },
          totalHours: { $sum: '$duration' },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
          },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    const totalSessions = await StudySession.countDocuments(matchStage);
    const totalHours = await StudySession.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$duration' } } }
    ]);

    res.json({
      bySubject: stats,
      totalSessions,
      totalHours: totalHours[0]?.total || 0
    });
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({ message: 'Server error fetching session statistics' });
  }
};