const express = require('express');
const {
  getBudgets,
  saveBudget,
  deleteBudget,
  getBudgetAlerts
} = require('../controllers/budgetLimitController');

const router = express.Router();


router.get('/:userId', getBudgets);


router.post('/:userId', saveBudget);


router.delete('/:userId/:budgetId', deleteBudget);


router.get('/:userId/alerts', getBudgetAlerts);

module.exports = router;