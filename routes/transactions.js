const express = require('express');
const {
  getTransactions,
  getStats,
  addTransaction,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');

const router = express.Router();


router.get('/:userId', getTransactions);
router.get('/:userId/stats', getStats);
router.post('/:userId', addTransaction);
router.put('/:userId/:transactionId', updateTransaction);
router.delete('/:userId/:transactionId', deleteTransaction);

module.exports = router;