'use strict';

import crypto from 'crypto';
import request from 'request-promise';
import {Generation,Installation} from '../sqldb';

module.exports = {
  importData: importData
};

function importData() {
  console.log('import RTONE data');

  return Installation
            .findAll({
              where: {
                source: 'rtone'
              },
              include: [{
                model: Generation
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

  console.log('==========================================')
  console.log(installations[0]);
  console.log('==========================================')
  return;

  installations.forEach(function(installation, index) {
    setTimeout(function() {
      importInstallationGeneration(installation._id);
    }, 1000 * index);
  });
}

function importInstallationGeneration(id) {
  var url = buildUrl(id);
console.log(url); return;
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
function parseInstallationData(data) {
  console.log('------------------------------------')
  console.log(this, data)
  console.log('------------------------------------')
  return {
    id: this._id,
    data: data
  };
}

function storeInstallationData(installation) {
  console.log(installation.id, installation.data);
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
