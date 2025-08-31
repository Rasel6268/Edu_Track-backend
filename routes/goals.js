const express = require('express');
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  toggleGoalCompletion,
  getGoalsStats
} = require('../controllers/goalController');


const router = express.Router();




router.get('/:userEmail', getGoals);


router.post('/', createGoal);

router.get('/:userId/stats', getGoalsStats);

router.put('/:id', updateGoal);


router.delete('/:id', deleteGoal);

router.patch('/:id/toggle', toggleGoalCompletion);

module.exports = router;