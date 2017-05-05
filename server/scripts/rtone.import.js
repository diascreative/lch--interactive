'use strict';

import crypto from 'crypto';
import request from 'request-promise';
import schedule from 'node-schedule';
import { Generation, Installation, Quickbase, sequelize } from '../sqldb';
import config from '../config/environment';

const ROOT_URL = config.externalSites.rtone.url;
const LOGIN_DETAILS = config.externalSites.rtone.accounts;

module.exports = {
  scheduleJobs: scheduleJobs
};

function scheduleJobs() {
  if (!config.externalSites.rtone.url ||
      !config.externalSites.rtone.accounts) {
    return;
  }

  // import data on server start
  // quickBase();
  // importData();
  // importTotalGeneration();

  console.log('Schedule Rtone imports');
  console.log('----------------------');

  schedule.scheduleJob('45 3 * * *', quickBase);

  // import total generation for installations
  schedule.scheduleJob('30 3 * * *', importTotalGeneration);

  // Remember that our data are updated twice a day between 00:00 and 02:00 GMT and 12:00 and 14:00 GMT, so you don't need to perform a lot off calls every day.
  schedule.scheduleJob('0 3, 15 * * *', importData);
}

function importTotalGeneration() {
  console.log('Import total gen from RTONE', new Date());

  return getRtoneInstallations()
    .catch(handleError)
    .then(importTotal);
}

function importData() {
  console.log('Import from RTONE', new Date());

  return getRtoneInstallations()
    .catch(handleError)
    .then(beginMigration);
}

function getRtoneInstallations() {
  return Installation.findAll({
    attributes: [
      '_id',
      'name',
      'capacity',
      'source',
      'lastIndex',
      'quickbase',
      [sequelize.fn('max', sequelize.col('Generations.datetime')), 'lastUpdate']
    ],
    where: {
      $or: [{ source: 'rtone' }, { source: 'rtone1' }, { source: 'rtone2' }]
    },
    include: [
      {
        model: Generation,
        attributes: []
      }
    ],
    group: ['_id']
  });
}

function handleError(one) {
  console.error(one);
}

function beginMigration(installations) {
  installations.forEach(function(installation, index) {
    setTimeout(function() {
      importInstallationGeneration(installation);
    }, 1000 * index);
  });
}

function importTotal(installations) {
  console.log(installations.length);

  installations.forEach(function(installation, index) {
    setTimeout(function() {
      importInstallationTotalGeneration(installation);
    }, 1000 * index);
  });
}

function importInstallationGeneration(installation) {
  var url = buildUrl(installation);
  console.log(`import ${installation.name} : ${url}`);

  return request(url)
    .then(parseInstallationData(installation))
    .then(storeInstallationData);
}

function importInstallationTotalGeneration(installation) {
  var url = buildUrl(installation, 'total');
  console.log(`import total for ${installation.name} : ${url}`);

  return request(url)
    .then(parseTotalGenerationData(installation))
    .then(storeInstallationData);
}

function buildUrl(installation, type = 'production', step = 'hour') {
  let deviceId = installation._id;
  let lastUpdate = new Date(installation.dataValues.lastUpdate);

  const logins = LOGIN_DETAILS;

  const login = logins[installation.source].login;
  const password = logins[installation.source].password;

  const endDate = getDate();
  let startDate = getDate(lastUpdate);

  let delta = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24);

  if (delta > 31) {
    // we need hourly values, 31 days is as far back as we can go
    const maxDelta = 30 * (1000 * 60 * 60 * 24);
    startDate = getDate(new Date(+new Date() - maxDelta));
  }

  // API endpoints
  //

  // API root
  const rootUrl = ROOT_URL;
  // Get device production between dates
  let url =
    `${rootUrl}getDeviceProduction?serialNumber=${deviceId}` +
    `&startDate=${startDate}&endDate=${endDate}&step=${step}`;

  // Get a list of the device's serial numbers
  // let url = `${rootUrl}listDevices?`;

  if (type === 'total') {
    url = `${rootUrl}getDeviceInfo?serialNumber=${deviceId}`;
  }

  if (type === 'production-radiation') {
    // lets go back and update the last 2 days to make sure it's all up to date
    const goBack = 2 * (1000 * 60 * 60 * 24);
    startDate = getDate(new Date(lastUpdate - goBack));
    // Get device production and radiation between dates
    url =
      `${rootUrl}getDeviceProductionAndRadiation?serialNumber=${deviceId}` +
      `&startDate=${startDate}&endDate=${endDate}&step=${step}`;
  }

  if (type === 'smart') {
    // lets go back and update the last 2 days to make sure it's all up to date
    const goBack = 2 * (1000 * 60 * 60 * 24);
    startDate = getDate(new Date(lastUpdate - goBack));
    url =
      `${rootUrl}getDeviceSmartData?serialNumber=${deviceId}` +
      `&startDate=${startDate}&endDate=${endDate}&step=${step}`;
  }

  // TODO remove line
  // url = `${rootUrl}listDevices?`;

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

function quickBase() {
  console.log('quick basing');
  getRtoneInstallations().then(runQuickBaseScripts);
}

function runQuickBaseScripts(installations) {
  return installations
    .filter(i => i && i.quickbase && i.quickbase.generation)
    .forEach(function(installation, index) {
      setTimeout(function() {
        getQuickBaseData(installation).then(importQuickBaseData(installation));
      }, 1000 * index);
    });
}

function getQuickBaseData(installation) {
  const promises = [];
  promises.push(
    request(buildUrl(installation, 'production-radiation', 'day', 7))
  );

  if (installation.quickbase.export) {
    promises.push(request(buildUrl(installation, 'smart', 'day', 7)));
  }

  return Promise.all(promises);

  // From the SmartDeviceData - only applicable to meters tagged Rtone - Dual (Export)
}

function importQuickBaseData(installation) {
  return function(promises) {
    let exportData = [];
    // radiation
    const radiationData = JSON.parse(promises[0])
      .records.filter(item => {
        // get only those from midnight
        return item.measureDate.indexOf('00:00:00') > -1;
      })
      .map(item => {
        // Date (in QB) = measureDate
        // Incremental Reading (QB) = measure/1000
        // Performance Ratio (QB) = (measure/[meter capacity])/radiation
        const incrementalReading = item.measure / 1000;
        const performanceRatio = item.radiation && item.radiation / 1 !== 0 ?
          1000 * (item.measure / installation.capacity / item.radiation) :
          0;

        // add the installation id for storing it
        return {
          date: item.measureDate.replace('T00', ' 00'),
          InstallationId: installation._id,
          incremental: incrementalReading,
          performanceRatio: performanceRatio,
          type: 'generation'
        };
      });

    if (promises.length > 1) {
      exportData = JSON.parse(promises[1])
        .records.filter(item => {
          // get only those from midnight
          return item.measureDate.indexOf('00:00:00') > -1;
        })
        .map(item => {
          // {
          //   "measureDate": "2016-10-25T00:00:00",
          //   "prod": "26578.0",
          //   "in1": "27120.0",
          //   "out1": "120.0",
          //   "in2": "-1"
          // }
          // Date (in QB) = measureDate
          // Incremental Reading (QB) = out1/1000
          const incrementalReading = item.out1 / 1000;
          // add the installation id for storing it
          return {
            date: item.measureDate.replace('T00', ' 00'),
            InstallationId: installation._id,
            incremental: incrementalReading,
            type: 'export',
            performanceRatio: 0
          };
        });
    }

    console.log(installation._id, radiationData.length, radiationData.length);

    if (radiationData.length) {
      quickBaseStoreQuery(radiationData);
    }
    if (exportData.length) {
      quickBaseStoreQuery(exportData);
    }
  };
  // {
  //             "measureDate": "2016-10-28T00:00:00",
  //             "measure": "30030.0",
  //             "radiation": "1438.0"
  //         }
  //   }
}

function quickBaseStoreQuery(data) {
  return Quickbase.bulkCreate(data, {
    updateOnDuplicate: ['incremental', 'performanceRatio']
  });
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
        if (record.measure === '0.0' || parseFloat(record.measure) < 0) {
          return;
        }

        generations.push({
          InstallationId: installation._id,
          InstallationName: installation.name,
          datetime: new Date(record.measureDate),
          generated: parseFloat(record.measure)
        });
      });
    }

    return generations;
  };
}

/**
 * [setInstallationData description]
 * @param {[type]} data [description]
 */
function parseTotalGenerationData(installation) {
  return function(data) {
    if (data) {
      data = JSON.parse(data);

      const lastIndex = parseInt(data.lastIndex);

      if (lastIndex > installation.lastIndex) {
        installation.updateAttributes({
          lastIndex: lastIndex
        });
      }

      Quickbase.bulkCreate([{
        date: new Date(data.lastIndexDate).setUTCHours(0, 0, 0, 0),
        meterReading: installation.lastIndex,
        InstallationId: installation._id
      }], {
        updateOnDuplicate: ['meterReading']
      });
    }

    return installation;
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

  return (
    time.getUTCFullYear() +
    '-' +
    pad(time.getUTCMonth() + 1) +
    '-' +
    pad(time.getUTCDate()) +
    'T' +
    pad(time.getUTCHours()) +
    ':' +
    pad(time.getUTCMinutes()) +
    ':00'
  );
}
