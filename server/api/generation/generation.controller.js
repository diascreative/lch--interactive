/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/generations              ->  index
 * GET     /api/generations/historic     ->  historic
 * GET     /api/generations/historic/:id     ->  singleHistoric
 */

'use strict';

import {Generation, sequelize} from '../../sqldb';

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

export function index(req, res) {
  var superQuery = `
  SELECT
    MAX(\`datetime\`) AS \`datetime\`,
    SUM(\`generated\`) AS \`generated\`,
    InstallationName
  FROM
      Generations a
      inner join
          (
            SELECT
              MAX(\`datetime\`) as \`max_datetime\`, InstallationId
            FROM
              \`Generations\`
            GROUP BY
              InstallationId
          ) as b on
          a.InstallationId = b.InstallationId AND a.datetime = b.max_datetime
  GROUP BY InstallationName
  ORDER BY InstallationName
  `;

  sequelize.query(superQuery, { type: sequelize.QueryTypes.SELECT})
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));

}

// Gets a single Installation from the DB
export function historic(req, res) {
  return Generation
    .findAll({
      attributes: [
        [sequelize.fn('max', sequelize.col('datetime')), 'datetime'],
        [sequelize.fn('date_format', sequelize.col('datetime'), '%h-%Y-%m-%d'), 'date_col_formed'],
        [sequelize.fn('sum', sequelize.col('generated')), 'generated']
      ],
      group: [
        'date_col_formed'
      ],
      limit: 100,
      order: 'datetime DESC'
    })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Installation from the DB
export function historicSingle(req, res) {
  return Generation
    .findAll({
      where: {
        InstallationName: req.params.name
      },
      attributes: [
        'datetime',
        [sequelize.fn('sum', sequelize.col('generated')), 'generated']
      ],
      group: [
        'datetime'
      ],
      limit: 100,
      order: 'datetime DESC'
    })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}
