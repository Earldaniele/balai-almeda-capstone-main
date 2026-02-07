const { Sequelize } = require('sequelize');
require('dotenv').config();

// Connect to the 'balai_almeda_db' database in XAMPP
const sequelize = new Sequelize(
  process.env.DB_NAME || 'balai_almeda_db', // Database name
  process.env.DB_USER || 'root',            // XAMPP default user
  process.env.DB_PASS || '',                // XAMPP default password (empty)
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false, // Set to console.log to see raw SQL queries
  }
);

module.exports = sequelize;