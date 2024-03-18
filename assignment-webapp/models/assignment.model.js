const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

module.exports = () => {
const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    readOnly: true,
  },
  user_id: {
    type: DataTypes.UUID,
    field: 'user_id',
    readOnly: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Assignment name should be unique',
      fields: ['name'],
    },
    validate: {
      notEmpty: true,
    },
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: {
        msg: "Points must be an integer.",
      },
      min: {
        args: [1],
        msg: "Points must be at least 1.",
      },
      max: {
        args: [10],
        msg: "Points cannot exceed 10.",
      },
    },
  },
  num_of_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: {
        msg: "Number of attempts must be an integer.",
      },
      min: {
        args: [1],
        msg: "Number of attempts must be at least 1.",
      },
      max: {
        args: [3],
        msg: "Number of attempts cannot exceed 3.",
      },
    },
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterNow(value) {
        // Custom validation function to check if the deadline is greater than the current date
        if (new Date(value) <= new Date()) {
          throw new Error('Deadline must be greater than the current date.');
        }
      },
    },
  },
  assignment_created: {
    type: DataTypes.DATE,
    allowNull: true,
    readOnly: true,
  },
  assignment_updated: {
    type: DataTypes.DATE,
    allowNull: true,
    readOnly: true,
  },
}, {
  timestamps: true,
  // I don't want createdAt
  createdAt: 'assignment_created',
  // I want updatedAt to actually be called updateTimestamp
  updatedAt: 'assignment_updated'
  });

  Assignment.associate = (models) => {
    models.Assignment.belongsTo(models.User, {
      foreignKey: 'id',
      as: 'user',
    })
  }
  return Assignment;
};

