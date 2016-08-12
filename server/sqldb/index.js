/**
 * Sequelize initialization module
 */

'use strict';

import config from '../config/environment';
import Sequelize from 'sequelize';

var db = {
  Sequelize,
  sequelize: new Sequelize(config.sequelize.database,
                           config.sequelize.username,
                           config.sequelize.password,
                           config.sequelize.options)
};

// Insert models below
db.Generation = db.sequelize.import('../api/generation/generation.model');
db.Installation = db.sequelize.import('../api/installation/installation.model');
db.User = db.sequelize.import('../api/user/user.model');

// Insert associations below
db.Generation.belongsTo(db.Installation);
db.Installation.hasMany(db.Generation);

module.exports = db;
