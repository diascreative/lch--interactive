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

  // import data every 30 mins
  schedule.scheduleJob('1,31 * * * *', importData);
}

/**
 * Get Emig installations and make calls to get their CSVs to then
 * parse data for the historical graphs
 */
function importData() {
  console.log('Import from Emig', new Date());

  return getEmigInstallations()
    .catch(handleSqlError)
    .then(beginMigration);
}

/**
 * Get our list of installations which belong to Emig
 */
function getEmigInstallations() {
  // our source countains emig:${emigId}
  // we need to grab the emigID from there to use in the http requests
  return Installation
    .findAll({
      attributes: [
        '_id',
        'name',
        [sequelize.fn('replace', sequelize.col('source'), 'emig:', ''), 'emigId'],
        [sequelize.fn('max', sequelize.col('Generations.datetime')), 'lastUpdate']
      ],
      where: {
        source: {
          $like: 'emig:%'
        }
      },
      include: [{
        model: Generation,
        attributes: []
      }],
      group: [
        '_id'
      ]
    });
}

/**
 * Handle any possible SQL errors
 */
function handleSqlError(err) {
  console.log('sql query error', err);
}

/**
 * Bring in the data
 */
function beginMigration(installations) {
  if (installations) {
    return logIn()
      .then(importInstallationsGeneration(installations))
      .catch(importInstallationsGeneration(installations));
  }
}

/**
 * Log into EMIG. All installaitons are under the same account.
 * So log in once, retrieve 'em all.
 */
function logIn() {
  const url = `${ROOT_URL}e/login`;
  const data = LOGIN_DETAILS;

  const options = {
    method: 'POST',
    uri: url,
    form: data
  };

  return request(options);
}

/**
 * Once we have logged into EMIG, get the CSV for each installation
 */
function importInstallationsGeneration(installations) {
  return function(res) {
    if (res.statusCode === 302) {
      const cookie = res.response.headers['set-cookie'][0].split(';')[0];

      installations.forEach(function(installation) {
        importInstallationGeneration(cookie, installation);
      });
    }
  }
}

/**
 * Parse each CSV and store its data for the historical generation
 */
function importInstallationGeneration(cookie, installation) {
  return request({
      uri: `${ROOT_URL}e/readings/${installation.dataValues.emigId}.csv`,
      headers: {
        'Cookie': cookie
      },
      resolveWithFullResponse: true
    })
    .then(parseInstallationData(installation))
    .then(storeInstallationData);
}

/**
 * Parse the CSV response and create a new object to store in Generations
 */
function parseInstallationData(installation) {
  return function(data) {
    const newData = csv2array.parse(data.body);
    const lastUpdate = new Date(installation.dataValues.lastUpdate);

    let parsed = newData.map(function(reading) {
      if (!reading.length) {
        return;
      }

      const dateString = reading[9] + ' GMT';
      const actualDate = new Date(Date.parse(dateString));
      const generated = parseInt(reading[11], 10) * 1000;

      return {
        datetime: actualDate,
        generated: generated,
        InstallationId: installation._id,
        InstallationName: installation.name
      }
    });

    // only create object for those reading which occurred after the last import
    return parsed.filter(function(newReading) {
      return newReading && newReading.datetime > lastUpdate;
    });
  }
}

/**
 * Lets store it all
 */
function storeInstallationData(data) {
  console.log('storing data!', data.length);
  return Generation.bulkCreate(data);
}
