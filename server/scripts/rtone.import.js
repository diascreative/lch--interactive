'use strict';

import crypto from 'crypto';
import request from 'request-promise';
import schedule from 'node-schedule';
import {Generation,Installation,sequelize} from '../sqldb';

module.exports = {
  scheduleJobs: scheduleJobs
};

function scheduleJobs() {
  // import data at 10am and pm every day
  schedule.scheduleJob('0 10,22 * * *', importData);
}

function importData() {
  console.log('Import from RTONE', new Date());
  return Installation
            .findAll({
              attributes: [
                '_id',
                'source',
                [sequelize.fn('max', sequelize.col('Generations.datetime')), 'lastUpdate']
              ],
              where: {
                source: 'rtone'
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
  installations.forEach(function(installation, index) {
    setTimeout(function() {
      importInstallationGeneration(installation);
    }, 1000 * index);
  });
}

function importInstallationGeneration(installation) {
  var url = buildUrl(installation);

  return request(url)
          .then(parseInstallationData(installation))
          .then(storeInstallationData);
}

function buildUrl(installation) {
  let deviceId = installation._id;
  let lastUpdate = new Date(installation.dataValues.lastUpdate);


  // Get a list of the device's serial numbers
  // let url = `${rootUrl}listDevices?`;

  // Get device info
  // let url = `${rootUrl}getDeviceInfo?serialNumber=${deviceId}`;

  // Get device production between dates
  let url = `${rootUrl}getDeviceProduction?serialNumber=${deviceId}` +
            `&startDate=${startDate}&endDate=${endDate}&step=${step}`;

  // Get device production and radiation between dates
  // let url = `${rootUrl}getDeviceProductionAndRadiation?serialNumber=${deviceId}&startDate=${startDate}&endDate=${endDate}&step=${step}`;

  // set a GMT date and control the time
  // must be in the last 10 mins from the GMT server time
  let time = getDate();

  // concatenate
  let string = login + password + time;

  // encrypt string and base64 encode
  let shasum = crypto.createHash('sha1');
  let hash = shasum.update(string).digest('base64');

  // replace bad characters
  hash = hash.replace(new RegExp(/\n/), '');
  hash = hash.replace(new RegExp(/=/), '');
  hash = hash.replace(new RegExp(/\+/), '-');
  hash = hash.replace(new RegExp(/\//), '_');

  return `${url}&login=${login}&mps=${hash}&requestDate=${time}`;
}

/**
 * [setInstallationData description]
 * @param {[type]} data [description]
 */
function parseInstallationData(installation) {
  return function(data) {
    var generations = [];

    if (data) {
      data = JSON.parse(data);

      data.records.forEach(function(record) {
        if (record.measure === '0.0' ||
            parseFloat(record.measure) < 0) {
          return;
        }

        generations.push({
          InstallationId: installation._id,
          datetime: new Date(record.measureDate),
          generated: parseFloat(record.measure)
        })
      });
    }

    return generations;
  };
}

function storeInstallationData(data) {
  return Generation.bulkCreate(data);
}

function getDate(time) {
  if (typeof time === 'undefined') {
    time = new Date();
  }

  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }

  return time.getUTCFullYear() +
        '-' + pad(time.getUTCMonth() + 1) +
        '-' + pad(time.getUTCDate()) +
        'T' + pad(time.getUTCHours()) +
        ':' + pad(time.getUTCMinutes()) +
        ':00';
}
