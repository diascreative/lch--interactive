'use strict';

import request from 'request-promise';
import schedule from 'node-schedule';
import csv2array from '../components/csv2array';
import { Generation, Installation, Quickbase, sequelize } from '../sqldb';
import config from '../config/environment';

module.exports = {
  scheduleJobs: scheduleJobs
};

const LOGIN_DETAILS = config.externalSites.emig.account;
const ROOT_URL = config.externalSites.emig.url;

function scheduleJobs() {
  if (!config.externalSites.emig.url || !config.externalSites.emig.account) {
    return;
  }

  console.log('Schedule Emig imports');
  console.log('----------------------');

  // import data on server start
  // importData();
  // importDailyData();

  // import data every 30 mins
  schedule.scheduleJob('1,31 * * * *', importData);

  // import daily data every day
  schedule.scheduleJob('25 8 * * *', importDailyData);
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
 * Get Emig installations and make calls to get their CSVs to then
 * parse data to store how much they have produced in the previous days
 */
function importDailyData() {
  console.log('Import daily from Emig', new Date());

  return getEmigInstallations()
    .catch(handleSqlError)
    .then(storeDailyProduction);
}

/**
 * Get our list of installations which belong to Emig
 */
function getEmigInstallations() {
  // our source countains emig:${emigId}
  // we need to grab the emigID from there to use in the http requests
  return Installation.findAll({
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
    include: [
      {
        model: Generation,
        attributes: []
      }
    ],
    group: ['_id']
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
 * Bring in the data
 */
function storeDailyProduction(installations) {
  console.log(`Importing emig daily date for ${installations.length} instalaltions`);

  if (installations) {
    return logIn()
      .then(importDailyProduction(installations))
      .catch(importDailyProduction(installations));
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
  };
}

/**
 * Parse each CSV and store its data for the historical generation
 */
function importInstallationGeneration(cookie, installation) {
  return request({
    uri: `${ROOT_URL}e/readings/${installation.dataValues.emigId}.csv`,
    headers: {
      Cookie: cookie
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
      };
    });

    // only create object for those reading which occurred after the last import
    return parsed.filter(function(newReading) {
      return newReading && newReading.datetime > lastUpdate;
    });
  };
}

/**
 * Lets store it all
 */
function storeInstallationData(data) {
  console.log('storing data!', data.length);

  return Generation.bulkCreate(data);
}

function importDailyProduction(installations) {
  return function(res) {
    console.log(`Emig: Logged in reponse is : ${res.statusCode}`);

    if (res.statusCode === 302) {
      const cookie = res.response.headers['set-cookie'][0].split(';')[0];

      installations.forEach(function(installation) {
        importInstallationDaily(cookie, installation);
      });
    }
  };
}

/**
 * Parse each CSV and store its data for the historical generation
 */
function importInstallationDaily(cookie, installation) {
  console.log(`Emig: make the GET request for installation with id : ${installation._id}`);

  return request({
    uri: `${ROOT_URL}e/readings/reverse/${installation.dataValues.emigId}.csv`,
    headers: {
      Cookie: cookie
    },
    resolveWithFullResponse: true
  })
    .then(parseInstallationDailyData(installation))
    .then(storeInstallationDailyData);
}

/**
 * Parse the CSV response and create a new object to store in Generations
 */
function parseInstallationDailyData(installation) {
  console.log(`Emig: parse GET request for installation with id : ${installation._id}`);

  return function(data) {
    const rows = csv2array.parse(data.body);

    // we want to update this for the last 2 days - to make sure any fixes in 24h were missed
    // the script will run in the morning
    // so the end date is the start of today
    const startToday = new Date();
    startToday.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(startToday.getTime() + 24 * 60 * 60 * 1000);

    // the first reading for yesterday
    const startYesterday = new Date();
    startYesterday.setDate(startYesterday.getDate() - 1);
    startYesterday.setUTCHours(0, 0, 0, 0);

    // the first reading for the day before yesterday
    const startDayBeforeYesterday = new Date();
    startDayBeforeYesterday.setDate(startDayBeforeYesterday.getDate() - 2);
    startDayBeforeYesterday.setUTCHours(0, 0, 0, 0);


    const last3Midnights = rows
      // remove if we have fewer than 9 columns
      .filter(reading => reading.length > 9)
      // lets build objects with proper dates and days
      .map(reading => {
        // make sure the midnight reading is between last midnight and 2 nights ago
        const dateString = reading[9] + ' GMT';
        const readingDate = new Date(Date.parse(dateString));
        const dayDate = new Date(Date.parse(dateString));
        const totalReading = parseFloat(reading[10], 10) * 1000;

        return {
          date: readingDate,
          day: dayDate.setUTCHours(0, 0, 0, 0),
          reading: totalReading
        };
      })
      // only get the readings from the last 3 days
      .filter(row => row.day >= startDayBeforeYesterday)
      // group the readings by their day
      .reduce((acc, row) => {
        if (!acc[row.day]) {
          acc[row.day] = {
            last: {
              date: 0
            },
            first: {
              date: tomorrow
            }
          };
        }

        // if the last reading for this day is before the row's day... update it!
        if (acc[row.day].last.date < row.day) {
          acc[row.day].last = Object.assign({}, row);
        }

        // if the first reading for this day is after the row's day... update it!
        if (acc[row.day].first.date > row.day) {
          acc[row.day].first = Object.assign({}, row);
        }

        return acc;
      }, {});

    const firstReadingsOfLastDays = [];

    for (let date in last3Midnights) {
      firstReadingsOfLastDays.push(last3Midnights[date].first);
    }

    if (firstReadingsOfLastDays.length !== 3) {
      // something bad has happened, we don't want to parse this data
      return false;
    }

    // build the readings to be stored for the last 2 days
    const readings = [
      {
        date: firstReadingsOfLastDays[0].date,
        incremental: firstReadingsOfLastDays[0].reading - firstReadingsOfLastDays[1].reading,
        meterReading: firstReadingsOfLastDays[0].reading,
        performanceRatio: 0,
        InstallationId: installation._id,
        type: 'generation'
      },
      {
        date: firstReadingsOfLastDays[1].date,
        incremental: firstReadingsOfLastDays[1].reading - firstReadingsOfLastDays[2].reading,
        meterReading: firstReadingsOfLastDays[1].reading,
        performanceRatio: 0,
        InstallationId: installation._id,
        type: 'generation'
      }
    ];

    return readings;
  };
}

function storeInstallationDailyData(data) {
  console.log(`Emig: store data.`);
  console.log(`Emig: there are ${data.length} new data points`);

  // TODO: store the incrementals for the last 2 days
  return Quickbase.bulkCreate(data, {
    updateOnDuplicate: ['incremental', 'meterReading', 'performanceRatio']
  });
}
