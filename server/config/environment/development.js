'use strict';

// Development specific configuration
// ==================================
module.exports = {

  // Sequelize connection opions
  sql: {
    dialect: 'mysql'
  },
  sequelize: {
    database: 'lch--interactive',
    username: 'root',
    password: '',
    options: {
      logging: true
    }
  },
  seedDB: false
};
