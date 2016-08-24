/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/generations              ->  index
 * GET     /api/generations/historic     ->  historic
 * GET     /api/generations/historic/:id     ->  singleHistoric
 */

'use strict';

import {Installation, Generation, sequelize} from '../../sqldb';

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

// Gets the historic data for filtered installations
export function historic(req, res) {
  const localAuthorities = req.query.localAuthorities;
  const owner = req.query.ownership;
  const ownershipType = req.query.ownershipType;
  const energyType = req.query.energyType;

  let whereFilter = {};

  if (localAuthorities && localAuthorities !== 'all') {
    whereFilter.localAuthority = localAuthorities;
  }

  if (owner && owner !== 'all') {
    whereFilter.owner = owner;
  }

  if (ownershipType && ownershipType !== 'all') {
    whereFilter.ownershipType = ownershipType;
  }

  if (energyType && energyType !== 'all') {
    whereFilter.energyType = energyType;
  }

  return Installation.findAll({
    attributes: ['_id'],
    where: whereFilter
  })
  .then(historicMultiple(whereFilter))
  .then(respondWithResult(res))
  .catch(handleError(res));
}

function historicMultiple(whereFilter) {
  return function(installationIds=[]) {
    let where = {};

    if (Object.getOwnPropertyNames(whereFilter).length > 0) {
        const ids = installationIds.map(installation => {
        return installation.dataValues._id
      });

      where.InstallationId = ids;
    }

    return Generation
      .findAll({
        attributes: [
          [sequelize.fn('max', sequelize.col('datetime')), 'datetime'],
          [sequelize.fn('date_format', sequelize.col('datetime'), '%Y%m%d%h'), 'date_col_formed'],
          [sequelize.fn('sum', sequelize.col('generated')), 'generated']
        ],
        where: where,
        group: [
          'date_col_formed'
        ],
        limit: 100,
        order: 'datetime DESC'
      });
  }
}

// Gets the historic data for an installation
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
