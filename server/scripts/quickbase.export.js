'use strict';

import QuickBase from 'quickbase'
import schedule from 'node-schedule';

import config from '../config/environment';
import {Installation, Quickbase, sequelize} from '../sqldb';

// Init Quickbase
const quickbase = new QuickBase({
  realm: config.quickbase.realm,
  appToken: config.quickbase.appToken
});

export function scheduleJobs() {
  if (!config.quickbase.dbid ||
      !config.quickbase.realm ||
      !config.quickbase.appToken ||
      !config.quickbase.username ||
      !config.quickbase.password) {
    return;
  }

  console.log('schedules quickbase export jobs');
  // exportYesterdayToQuickBase();
  // exportYesterdayToQuickBase();
  schedule.scheduleJob('0 9 * * *', exportYesterdayToQuickBase);
}

/**
 * Run the scripts to export data from our database into QuickBase
 *
 * @returns Promise
 */
export function exportYesterdayToQuickBase() {
  return qbAuthenticate()
    .then(getInstallations)
}

/**
 * Authenticate with quickbase
 *
 * @returns Promise
 */
function qbAuthenticate() {
  console.log('authenticate');
  return quickbase.api('API_Authenticate', {
    username: config.quickbase.username,
    password: config.quickbase.password
  });
}

/**
 * If we've authenticated correctly, get a list of our installations
 *
 * @param {any} result
 * @returns
 */
function getInstallations(result) {
  console.log('authentication attempted...');
  if (!result.ticket) {
    console.log('..UNsuccessfully');
    return;
  }

  console.log('..successfully');

  queryInstallations()
    .then(prepData)
    .then(addRecords)
    .then((promises) => {
      console.log(promises.length, 'records have been added');
    });
}

/**
 * Clean up the installations data to export to QuickBase
 *
 * @param {any} data
 * @returns
 */
function prepData(data) {
  const list = data.map((item) => {
    return {
      date: item.date,
      incremental: (item.incremental / 1000),
      installationId: item.Installation.quickbase[item.type],
      performanceRatio: item.performanceRatio,
      meterReading:  (item.meterReading / 1000)
    };
  });

  return list;
}

/**
 * Our Query to get the installations with QuickBase IDs
 *
 * @returns
 */
function queryInstallations() {
  const maxDelta = 2 * (1000 * 60 * 60 * 24);
  const endDate = new Date();
  endDate.setUTCHours(0, 0, 0, 0);
  const startDate = new Date(endDate - maxDelta);

  return Quickbase.findAll({
    attributes: [
      '_id',
      'InstallationId',
      [sequelize.fn('date_format', sequelize.col('date'), '%d/%m/%Y'), 'date'],
      'incremental',
      'type',
      'performanceRatio',
      'meterReading'
    ],
    include: [{
      model: Installation,
      attributes: ['quickbase']
    }],
    where: {
      $and: [
        { 'date': { lte: endDate } },
        { 'date': { gte: startDate } }
      ]
    },
    order: [
      ['date', 'ASC'],
      [Installation, 'quickbase', 'ASC']
    ]
  });
}

/**
 * Add all records to QuickBase
 *
 * @param {any} records
 * @returns Promise
 */
function addRecords(records) {
  console.log('check existing records');
  return Promise.all(records.map(apiCall));
}

/**
 * Make an API call to see if the record is already set
 * delete if it does. Then insert the new record for the date and installation
 *
 * @param {any} record
 * @returns
 */
function apiCall(record) {
  console.log('calling API for', JSON.stringify(record));

  return quickbase.api('API_DoQuery', {
    dbid: config.quickbase.dbid,
    query: `{6.IR.'${record.date}'}AND{8.CT.'${record.installationId}'}`
  })
    .then((res) => {
      if (res.table.records.length) {
        // delete any existing records for this date and installationId
        res.table.records.forEach(record => {
          quickbase.api('API_DeleteRecord', {
            dbid: config.quickbase.dbid,
            rid: record.rid
          });
        });
      }

      // add the new record
      return quickbase.api('API_AddRecord', {
        dbid: config.quickbase.dbid,
        fields: [
          { fid: 6, value: record.date },
          { fid: 7, value: record.incremental },
          { fid: 8, value: record.installationId },
          { fid: 55, value: record.performanceRatio },
          { fid: 84, value: record.meterReading }
        ]
      });
    });
}
