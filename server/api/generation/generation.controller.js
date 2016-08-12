/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/generations              ->  index
 */

'use strict';

import {sequelize} from '../../sqldb';

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
