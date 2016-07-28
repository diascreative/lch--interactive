'use strict';

import crypto from 'crypto';
import request from 'request-promise';
import {Installation} from '../sqldb';

module.exports = {
  importData: importData
};

function importData() {
  console.log('import RTONE data');

  return Installation
            .findAll({
              where: {
                source: 'rtone'
              }
            })
            .then(beginMigration);
}

function beginMigration(installations) {
  installations.each(function(installation, index) {
    setTimeout(function() {
      importInstallationGeneration(installation.id);
    }, 1000 * index);
  });
}

function importInstallationGeneration(id) {
  var url = buildUrl(id);

  return request(url)
          .then(parseInstallationData.bind(id))
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
  let time = getCurrentDate();

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
function parseInstallationData(data) {
  return {
    id: this._id,
    data: data
  };
}

function storeInstallationData(installation) {
  console.log(installation.id, installation.data);
}

function getCurrentDate() {
  let time = new Date();

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
