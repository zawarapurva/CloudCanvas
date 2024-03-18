// Define the Submission model
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

module.exports = () => {
const Submission = sequelize.define('Submission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    assignment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    submission_url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isURL: {
          args: true,
          msg:'Enter a valid URL'
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false,
    },
  }, {
    timestamps: true,
    // I don't want createdAt
    createdAt: 'submission_date',
    // I want updatedAt to actually be called updateTimestamp
    updatedAt: 'submission_updated'
  });

  Submission.associate = (models) => {
    models.Submission.belongsTo(models.Assignment, {
      foreignKey: 'id',
      as: 'assignment_id',
    })
    models.Assignment.hasMany(models.Submission, { 
        foreignKey: 'assignment_id' 
    });
  }
  return Submission;

}