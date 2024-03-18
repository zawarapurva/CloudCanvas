const express = require('express')
const app = express();
const db = require('../models/index')

const Assignment = db.assignment;
const Submission = db.submission;

const router = express.Router()
const {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  deleteAssignmentById,
  updateAssignmentById,
  submitAssignmentbyId
} = require('../controllers/assignment.controller')
const authorizeToken = require('../middlewares/auth')(Assignment, Submission)

// app.use((req, res, next) => {
//   console.log('req.originalUrl', req.originalUrl.split('/')[4])
//   if {
//     logger.warn('Url is not supported')
//     res.status(405).json();
//   }
// })

router.get('/', authorizeToken, getAllAssignments)
router.post('/', authorizeToken, createAssignment)
router.get('/:id',authorizeToken, getAssignmentById)
router.delete('/:id', authorizeToken, deleteAssignmentById)
router.put('/:id', authorizeToken, updateAssignmentById)
router.post('/:id/submission', authorizeToken, submitAssignmentbyId)

module.exports = router;
