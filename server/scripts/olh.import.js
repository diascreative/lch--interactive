'use strict';

import request from 'request-promise';
import schedule from 'node-schedule';
import csv2array from '../components/csv2array';
import { Generation, Installation, sequelize } from '../sqldb';


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
  return Installation.findAll({
    attributes: [
      '_id',
      'name',
      'source',
      [sequelize.fn('max', sequelize.col('Generations.datetime')), 'lastUpdate']
    ],
    where: {
      $or: [{ source: 'olh' }, { source: 'OLH' }]
    },
    include: [
      {
        model: Generation,
        attributes: []
      }
    ],
    group: ['_id']
  })
    .catch(handleError)
    .then(beginMigration);
}

function handleError(one) {
  console.log('error');
  console.error(one);
}

function beginMigration(installations) {
  console.log('got my csv from OHL');
  installations.forEach(function(installation) {
    importInstallationGeneration(installation);
  });
}

function importInstallationGeneration(installation) {
  let date = new Date();

  console.log('import generation');

  return makeHttpCall(date)
    .then(parseInstallationData(installation))
    .then(storeInstallationData);
}

/**
 * Make the HTTP call for the CSV file
 * @param  {Object} date
 * @param  {Number} the maximum number of iterations if we can't find the file
 */
function makeHttpCall(date = new Date(), count = 10) {
  date = new Date(date);

  const year = date.getUTCFullYear().toString().substr(2, 2);

  const month = date.getUTCMonth() < 9 ?
    '0' + (date.getUTCMonth() + 1).toString() :
    (date.getUTCMonth() + 1).toString();
  const day = date.getUTCDate() < 9 ?
    '0' + date.getUTCDate().toString() :
    date.getUTCDate().toString();

  const fileName = year + month + day + '00';

  const url = `${ROOT_URL}/${fileName}.CSV`;

  console.log('OLH try to import from', url);

  let options = {
    uri: url,
    headers: {
      Authorization: 'Basic ' + HASH
    }
  };

  return request(options).catch(check404(date, count));
}

function check404(date, count) {
  count--;

  return function() {
    if (count > 0) {
      const dayBefore = date.setDate(date.getDate() - 1);
      return makeHttpCall(dayBefore, count);
    } else {
      console.log('OLH failed to import anything!');
    }
  };
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
      };
    });

    let lastUpdate = new Date(installation.dataValues.lastUpdate);

    parsed = parsed.filter(function(newReading) {
      return newReading && newReading.datetime > lastUpdate;
    });

    console.log('parsed data!');

    return parsed;
  };
}

function storeInstallationData(data) {
  console.log('storing data!', data.length);
  return Generation.bulkCreate(data);
}
