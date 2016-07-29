/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';
import sqldb from '../sqldb';
var Installation = sqldb.Installation;
var Generation = sqldb.Generation;
var User = sqldb.User;

Installation.sync()
  .then(() => {
    return Installation.destroy({ where: {} });
  })
  .then(() => {
    Installation.bulkCreate([{
    .then(() => {
      Generation.sync()
        .then(() => {
          return Generation.destroy({ where: {} });
        });
    })
  });

User.sync()
  .then(() => User.destroy({ where: {} }))
  .then(() => {
    User.bulkCreate([{
      provider: 'local',
      name: 'Test User',
      email: 'test@example.com',
      password: 'test'
    }, {
      provider: 'local',
      role: 'admin',
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin'
    }])
    .then(() => {
      console.log('finished populating users');
    });
  });
