'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const db = {};

// 1. Load the shared Sequelize instance
const sequelize = require('../config/database');

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    // 2. Load the Model Definition
    const modelDef = require(path.join(__dirname, file));
    
    // 3. Handle Export Styles (The Fix for the Crash)
    let model;
    if (typeof modelDef === 'function' && !modelDef.options) {
        // Factory Pattern: module.exports = (sequelize) => {}
        model = modelDef(sequelize, Sequelize.DataTypes);
    } else {
        // Class Pattern: module.exports = ModelClass
        model = modelDef; 
    }

    // 4. Register Model
    if (model && model.name) {
        db[model.name] = model;
    }
  });

// 5. Setup Associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
