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
  quickbase: {
    realm: false,
    appToken: false,
    username: false,
    password: false,
    dbid: false
  },
  redis: {
    enabled: true,
    key: 'lch-development---'
  },
  seedDB: false
};
