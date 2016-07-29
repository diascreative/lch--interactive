'use strict';

import request from 'request-promise';
import schedule from 'node-schedule';
import csv2array from '../components/csv2array';
import {Generation,Installation,sequelize} from '../sqldb';

module.exports = {
  scheduleJobs: scheduleJobs
};

function scheduleJobs() {
  // import data on server start
  importData();

  // import data every 15 mins
  schedule.scheduleJob('*/15 * * * *', importData);
}

function importData() {
  console.log('Import from OLH', new Date());
  return Installation
            .findAll({
              attributes: [
                '_id',
                'name',
                'source',
                [sequelize.fn('max', sequelize.col('Generations.datetime')), 'lastUpdate']
              ],
              where: {
                source: 'olh'
              },
              include: [{
                model: Generation,
                attributes: []
              }],
              group: [
                '_id'
              ]
            })
            .catch(handleError)
            .then(beginMigration);
}

function handleError(one) {
  console.error(one)
}

function beginMigration(installations) {
  installations.forEach(function(installation) {
    importInstallationGeneration(installation);
  });
}

function importInstallationGeneration(installation) {
  let options = {
    uri: url,
    headers: {
      'Authorization': 'Basic ' + hash
    }
  };

  return request(options)
          .then(parseInstallationData(installation))
          .then(storeInstallationData);
}

/**
 * [setInstallationData description]
 * @param {[type]} data [description]
 */
function parseInstallationData(installation) {
  return function(data) {
    console.log('downloaded data!');
    let newData = csv2array.parse(data);

    var parsed = newData.map(function(reading) {
      if (!reading.length) {
        return;
      }

      let dateString = reading[0] + ' ' + reading[1] + ' GMT';
      let actualDate = new Date(Date.parse(dateString));

      var generated = parseInt(reading[2], 10) * 100;

      return {
        datetime: actualDate,
        generated: generated,
        InstallationId: installation._id,
        InstallationName: installation.name
      }
    });

    let lastUpdate = new Date(installation.dataValues.lastUpdate);

    parsed = parsed.filter(function(newReading) {
      return newReading && newReading.datetime > lastUpdate;
    });

    console.log('parsed data!');

    return parsed;
  }
}

function storeInstallationData(data) {
  console.log('storing data!', data.length);
  return Generation.bulkCreate(data);
}
