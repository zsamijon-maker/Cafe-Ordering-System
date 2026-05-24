const express = require('express');
const { getStaff, createStaff, deleteStaff } = require('../controllers/staffController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validation');
const router = express.Router();

router.get('/', authMiddleware, roleMiddleware(['admin']), getStaff);
router.post('/', authMiddleware, roleMiddleware(['admin']), validate('createStaff'), createStaff);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteStaff);

module.exports = router;
