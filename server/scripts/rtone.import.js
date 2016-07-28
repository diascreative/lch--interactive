'use strict';

import crypto from 'crypto';
import request from 'request-promise';
import {Generation,Installation} from '../sqldb';

module.exports = {
  importData: importData
};

function importData() {
  return Installation
            .findAll({
              where: {
                source: 'rtone'
              },
              include: [{
                model: Generation,
                attributes: ['datetime']
              }]
            })
            .catch(handleError)
            .then(beginMigration);
}

function handleError(one) {
  console.error(one)
}
function beginMigration(installations) {
  // TODO remove this line
  installations = installations.slice(0, 1);

  installations.forEach(function(installation, index) {
    setTimeout(function() {
      importInstallationGeneration(installation);
    }, 1000 * index);
  });
}

function importInstallationGeneration(installation) {
  var url = buildUrl(installation._id);

  return request(url)
          .then(parseInstallationData(installation))
          .then(storeInstallationData);
}


function buildUrl(deviceId) {
  // Get a list of the device's serial numbers
  // let url = `${rootUrl}listDevices?`;

  // // Get device info
  // let url = `${rootUrl}getDeviceInfo?serialNumber=${deviceId}`;

  // Get device production between dates
  let url = `${rootUrl}getDeviceProduction?serialNumber=${deviceId}` +
            `&startDate=${startDate}&endDate=${endDate}&step=${step}`;

  // // Get device production and radiation between dates
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
    if (data) {
      installation.newData = data;
    }

    return installation;
  };
}

function storeInstallationData(installation) {
  // todo: Check new dates, ADD EM ALL!
  console.log(installation._id, installation.newData);
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
