const express = require('express');
const {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  toggleSessionCompletion,
  getSessionStats
} = require('../controllers/sessionController');


const router = express.Router();



router.get('/:userEmail', getSessions);
router.post('/', createSession);
router.get('/stats', getSessionStats);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);
router.patch('/:id/toggle', toggleSessionCompletion);

module.exports = router;