const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

module.exports = () => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true,
      validate: {
        len: {
          args: [5, 500],
          msg: 'Password should be between 5 and 15 characters',
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      required: true,
      unique: {
        msg: 'Email should be unique',
        fields: ['email'],
      },
      allowNull: false,
      validate: {
        isEmail: {
          args: true,
          msg: 'Enter a valid email address!',
        },
      },
    },
    account_created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: true,
    },
    account_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: true,
    },
  }, { 
  timestamps: true,
  // I don't want createdAt
  createdAt: 'account_created',
  // I want updatedAt to actually be called updateTimestamp
  updatedAt: 'account_updated'
}
);

  return User;
};
