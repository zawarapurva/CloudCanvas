const db = require("../models/index");
const Assignment = db.assignment;
const Submission = db.submission;
const l = require("lodash");
const { setCustomHeaders } = require('../utils/setHeaders');
const logger = require('../config/logger.config')
const AWS = require('aws-sdk');
const appConfig = require('../config/app.config')

AWS.config.update({ region: process.env.AWS_REGION });

// Create and Save a new Assignment
exports.createAssignment = async (req, res) => {
  logger.info('Creating a new Assignment');
  // Validate request
  const allowedFields = ['name', 'points', 'num_of_attempts', 'deadline'];
  const bodyKeys = Object.keys(req.body);

  // Check if all fields in req.body are in the allowedFields array
  const isValid = bodyKeys.every((field) => allowedFields.includes(field));

  if (!isValid) {
    logger.error('Invalid fields in the request body');
    return res.status(400).json({ error: 'Invalid fields in the request body' });
  }

  if (!req.body.name) {
    res.status(400).json({
      message: "Content can not be empty!"
    });
    logger.error('Content can not be empty');
    return;
  }
  if(l.isNil(req.body.deadline) || !l.isString(req.body.deadline) || ! /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(req.body.deadline)){
    res.status(400).json({
      message: "The deadline is required and should be in the format 16-08-29T09:12:33.001Z"
    });
    logger.error('The deadline is required and should be in the format 16-08-29T09:12:33.001Z');
    return;
  }

  const { id } = req.user.dataValues

  // Create a Assignment
  const assignment = {
    name: req.body.name,
    points: req.body.points,
    num_of_attempts: req.body.num_of_attempts,
    deadline : req.body.deadline,
    user_id: id
  };

 // Save in the database
 Assignment.create(assignment)
 .then(data => {
   // Create a modified response object without user_id
   const responseData = {
     id: data.id, 
     name: data.name,
     points: data.points,
     num_of_attempts: data.num_of_attempts,
     deadline: data.deadline,
     assignment_created: data.assignment_created,
     assignment_updated: data.assignment_updated
   };
   
   setCustomHeaders(res);
   res.status(201).json(responseData);
   logger.info('Created Assignment');
 })
 .catch(err => {
   res.status(400).json({
     message: err.message
   });
   logger.error(err.message);
 });
};

// Retrieve all Assignment from the database
exports.getAllAssignments = (req, res) => {
  var length = req.headers['content-length'];
  if (length > 0) {
    logger.error('Request Body not allowed');
    return res.status(400).json();
  }
  Assignment.findAll()
    .then(data => {
      const filteredData = data.map(item => {
        // Using object destructuring to create a new object without 'user_id'
        const { user_id, ...rest } = item.dataValues;
        return rest;
      });
      setCustomHeaders(res);
      logger.info('Successfully retrieved all Assignment');
      res.status(200).json(filteredData);
    })
    .catch(err => {
      logger.error(err.message);
      res.status(400).json({
        message:
          err.message || "Some error occurred while retrieving assignments."
      });
    });
};

// Retrieve Assignment from the database
exports.getAssignmentById = (req, res) => {
  var length = req.headers['content-length'];
  if (length > 0) {
    logger.error('Request Body not allowed');
    return res.status(400).json();
  }
  
  const id = req.params.id;
  
  Assignment.findByPk(id)
    .then(data => {
      if (data) {
        const responseData = {
          id: data.id, 
          name: data.name,
          points: data.points,
          num_of_attempts: data.num_of_attempts,
          deadline: data.deadline,
          assignment_created: data.assignment_created,
          assignment_updated: data.assignment_updated
        };
        setCustomHeaders(res);
        res.status(200).json(responseData);
        logger.info('Successfully retrieved the Assignment');
      } else {
        res.status(404).json({
          message: `Cannot find Assignment with id=${id}.`
        });
        logger.warn(`Cannot find Assignment with id=${id}`);
      }
    })
    .catch(err => {
      res.status(400).json({
        message: "Error retrieving Assignment with id=" + id
      });
      logger.error(`Error retrieving Assignment with id= `+ id);
    });
};

// Delete Assignment from the database
exports.deleteAssignmentById = async(req, res) => {
  try {
    var length = req.headers['content-length'];
    if (length > 0) {
      logger.error('Request Body not allowed');
      return res.status(400).json();
    }

    const requestParamid = req.params.id;

    const { user_id } = await Assignment.findOne({
      where: { id: requestParamid }
    });

    const user_id_header = req.user.dataValues.id
  
    if(user_id_header === user_id) {
        Assignment.destroy({
            where: { id: requestParamid }
          })
            .then(num => {
              if (num == 1) {
                setCustomHeaders(res);
                res.status(204).json({
                  message: "Assignment was deleted successfully!"
                });
                logger.info('Assignment was deleted successfully');
              }
            })
            .catch(err => {
              res.status(400).json({
                message: "Could not delete Assignment with id=" + id
              });
              logger.error(`Could not delete Assignment with id=` + id);
            });
    } else {
        res.status(403).json({
            message: "You are not authorized to delete this assignment"
        });
        logger.warn(`You are not authorized to delete this assignment`);
    }
  } catch(e) {
    res.status(404).json({
      message: "Assignment not found!"
    });
    logger.error(`Assignment not found`);
  }
};

// Update Assignment from the database
exports.updateAssignmentById = async (req, res) => {
  try {
    const id = req.params.id;

    const { user_id } = await Assignment.findOne({
      where: { id: id }
    });

    const user_id_header = req.user.dataValues.id;

    if (user_id_header === user_id) {
      const allowedFields = ['name', 'points', 'num_of_attempts', 'deadline'];

      // Check if the request body has all the allowed fields and no extra fields
      const bodyKeys = Object.keys(req.body);
      const isValid = bodyKeys.every((field) => allowedFields.includes(field));

      if (!isValid || bodyKeys.length !== allowedFields.length) {
        res.status(400).json({
          message: "Invalid or incomplete fields in the request body"
        });
        return;
      }

      if (req.body.deadline && (!l.isString(req.body.deadline) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(req.body.deadline))) {
        res.status(400).json({
          message: "The deadline is required and should be in the format 2024-08-29T09:12:33.001Z"
        });
        return;
      }

      Assignment.update(req.body, {
        where: { id: id }
      })
        .then(num => {
          if (num == 1) {
            setCustomHeaders(res);
            res.status(204).json({
              message: "Assignment was updated successfully."
            });
          } else {
            res.status(404).json({
              message: `Cannot update Assignment with id=${id}. Maybe Assignment was not found or req.body is empty!`
            });
          }
        })
        .catch(err => {
          console.log(err);
          res.status(400).json({
            message: err.message
          });
        });
    } else {
      res.status(403).json({
        message: "You are not authorized to update this assignment"
      });
    }
  } catch (e) {
    res.status(404).json({
      message: "Assignment does not exist"
    });
  }
};

exports.submitAssignmentbyId = async (req, res) => {
  logger.info('Submitting Assignment');

  try {
    // Validate request
    const allowedFields = ['submission_url'];
    const bodyKeys = Object.keys(req.body);
  
    // Check if all fields in req.body are in the allowedFields array
    const isValid = bodyKeys.every((field) => allowedFields.includes(field));
  
    if (!isValid) {
      logger.error('Invalid fields in the request body');
      return res.status(400).json({ error: 'Invalid fields in the request body' });
    }

    // Extract data from the request
    const assignment_id = req.params.id
    const submission_url = req.body.submission_url;

    if (!submission_url) {
      res.status(400).json({
        message: "Content can not be empty!"
      });
      logger.error('Content can not be empty');
      return;
    }

    const zipPattern = /\.zip$/;
    // Test if the URL ends with ".zip" but not ".zip.zip"
    const isZipUrl = zipPattern.test(submission_url);
      
    if(!isZipUrl) {
      return res.status(400).json({ error: 'Invalid submission_url' })
    }

    // Check if assignment exists
    const assignment = await Assignment.findByPk(assignment_id);
    if (!assignment) {
      logger.error('Assignment not found');
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if the submission deadline has passed
    const currentDate = new Date();
    if (assignment.deadline < currentDate) {
      logger.error('Submission deadline has passed')
      return res.status(400).json({ error: 'Submission deadline has passed' });
    }

    // Check the number of submission attempts
    const existingSubmissions = await Submission.count({
      where: {
        assignment_id,
        email: req.user.email
      },
    });

    if (existingSubmissions >= assignment.num_of_attempts) {
      logger.error('Exceeded maximum number of attempts')
      return res.status(400).json({ error: 'Exceeded maximum number of attempts' });
    }

    // Create Submission record
    const newSubmission = {
      assignment_id,
      submission_url,
      email: req.user.email
    };

    Submission.create(newSubmission)
      .then(async data => {
        // Create a modified response object without email
        const responseData = {
          id: data.id, 
          assignment_id: data.assignment_id,
          submission_url: data.submission_url,
          submission_date: data.submission_date,
          submission_updated: data.submission_updated
        };

        // Publish to SNS topic
        const sns = new AWS.SNS();

        const snsParams = {
          Message: JSON.stringify({ 
            email: req.user.email, 
            url: submission_url,
            assignment: assignment.name,
            version: existingSubmissions
          }),
          TopicArn: appConfig.SNSTOPICARN
        };

        await sns.publish(snsParams).promise();
        
        setCustomHeaders(res);
        res.status(201).json(responseData);
        logger.info('Created Submission');
      })
      .catch(err => {
        res.status(400).json({
          message: err.message
        });
        logger.error(err.message);
      });

  } catch (error) {
    res.status(404).json({
      message: "Assignment not found!"
    });
    logger.error(`Assignment not found`);
  }
}
