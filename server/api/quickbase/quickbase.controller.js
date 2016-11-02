/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/quickbases              ->  index
 * POST    /api/quickbases              ->  create
 * GET     /api/quickbases/:id          ->  show
 * PUT     /api/quickbases/:id          ->  update
 * DELETE  /api/quickbases/:id          ->  destroy
 */

'use strict';

import {Quickbase} from '../../sqldb';

/**
 * Get list of all our installations
 */
export function index(req, res) {
  return queryGetData(req)
    .then(parseData())
    .then(responsdCSV(req, res));
}

function queryGetData(req) {
  const maxDelta = 7 * (1000 * 60 * 60 * 24);
  const endDate = req.body.endDate ? req.body.endDate : Date();
  const startDate = req.body.startDate ? req.body.startDate : new Date(+new Date() - maxDelta);

  return Quickbase.findAll({
    attributes: [
      '_id',
      'InstallationId',
      'date',
      'incremental',
      'performanceRatio'
    ],
    where: {
      $and: [
        {'date': { lt: endDate }},
        {'date': { gte: startDate }}
      ]
    }
  })
}

function parseData(req, res) {
  return function(data) {
    const list = data.map((item) => {
      return `${item.InstallationId}, ${item.date}, ${item.incremental}, ${item.performanceRatio}`;
    });

    console.log(list.join('\n'))

    return list.join('\n');
  }
}

function responsdCSV(req, res) {
  return function(data) {
    return res.set('Content-Type', 'text/csv').set('Content-Disposition', 'attachment; filename="users.csv"').status(200).send(data);
  }
}
