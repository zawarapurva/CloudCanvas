const Sequelize = require('sequelize')
const sequelize = require('../config/db.config') 
const dbConfig = require('../config/app.config')
const bcrypt = require('bcrypt')

const fs = require('fs');
const path = require('path');

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

db.users = require('./user.model')(sequelize, Sequelize)
db.assignment = require('./assignment.model')(sequelize, Sequelize)
db.submission = require('./submission.model')(sequelize, Sequelize)

const csvFilePath = '../users.csv'; // Replace with the path to your CSV file

// Read the CSV file
const csvData = fs.readFileSync(path.resolve(__dirname, csvFilePath), 'utf8');

// Split the CSV data into an array of rows
const csvRows = csvData.trim().split('\n');

// Extract column names from the first row
const columnNames = csvRows.shift().split(',');

db.connectionTest = async (req, res) => {
  try {
    await sequelize.authenticate()
    console.log("Successfully connected to database ")
  } catch (error) {
    console.log("Unable to connect to the database", error)
  }
}

db.syncDB = () => { 
  sequelize.sync({ force: true }).then(async () => {
    try {
      for (const csvRow of csvRows) {
        const rowValues = csvRow.split(',');
        const rowData = {};
        // Map CSV values to model attributes
        const indexOfPassword = columnNames.indexOf('password');

        columnNames.forEach((colName, index) => {
          if(index === indexOfPassword){
            const hashedPassword = bcrypt.hashSync(rowValues[index],10)
            rowData[colName] = hashedPassword;
          } else {
            rowData[colName] = rowValues[index];
          }
        });
        // Insert the data into the database
        await db.users.create(rowData);
      }
      console.log('Data imported successfully');
    } catch (error) {
      console.log(error.errors[0].message);
    }
  });
}

module.exports = db
