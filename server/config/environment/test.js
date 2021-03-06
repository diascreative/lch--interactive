'use strict';

// Development specific configuration
// ==================================
module.exports = {

  // Sequelize connection opions
  sql: {
    dialect: 'mysql',
    logging: false
  },
  sequelize: {
    database: 'lch--interactive--test',
    username: 'root',
    password: '',
    options: {
      logging: false
    }
  },
  seedDB: false
};
