/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/generations              ->  index
 * GET     /api/generations/historic     ->  historic
 * GET     /api/generations/historic/:id     ->  singleHistoric
 */

'use strict';

import {Installation, Generation, sequelize} from '../../sqldb';
import Util from '../../util';

/**
 * /api/generations
 * Return the latest generation data for all installations
 */
export function index(req, res) {
  const redisKey = `gen--index`;

  return Util.getCache(redisKey)
    .then(queryLiveGenerations(redisKey))
    .then(Util.handleEntityNotFound(res))
    .then(Util.respondWithResult(res))
    .catch(Util.handleError(res));

}

/**
 * /api/generations/historic
 * Gets the historic data for filtered installations
 */
export function historic(req, res) {
  const localAuthorities = req.query.localAuthorities;
  const owner = req.query.ownership;
  const ownershipType = req.query.ownershipType;
  const energyType = req.query.energyType;

  let whereFilter = {};

  const redisKey = `gen--historic-${localAuthorities}-${owner}-${ownershipType}-${energyType}`;

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

  return Util.getCache(redisKey)
    .then(queryHistoricMultiple(whereFilter, redisKey))
    .then(Util.respondWithResult(res))
    .catch(Util.handleError(res));
}

/**
 * /api/generations/historic/:id
 * Gets the historic data for an installation
 */
export function historicSingle(req, res) {
  const installationName = req.params.name;
  const redisKey = `generation--installation-${installationName}`;

  return Util.getCache(redisKey)
    .then(queryHistoricSingle(installationName, redisKey))
    .then(Util.handleEntityNotFound(res))
    .then(Util.respondWithResult(res))
    .catch(Util.handleError(res));
}


/**
 * DB query to get the latest live data for each installation
 * @param  {String} redisKey if we do a DB query, we'll cache the response
 */
function queryLiveGenerations(redisKey) {
  return function(cached) {
    if (cached) {
      return JSON.parse(cached);
    }

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

    return sequelize.query(superQuery, { type: sequelize.QueryTypes.SELECT})
      .then(Util.cacheResponse(redisKey));
  }
}

/**
 * DB query to get the historic generation for filtered installations
 * @param  {String} redisKey if we do a DB query, we'll cache the response
 */
function queryHistoricMultiple(whereFilter, redisKey) {
  return function(cached) {
    if (cached) {
      return JSON.parse(cached);
    }

    return Installation.findAll({
      attributes: ['_id'],
      where: whereFilter
    })
    .then(queryGenerationForIds(whereFilter))
    .then(Util.cacheResponse(redisKey));
  }
}

function queryGenerationForIds(whereFilter) {
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
          [sequelize.fn('date_format', sequelize.col('datetime'), '%Y%m%d%h%i'), 'date_col_formed'],
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

/**
 * DB query to get the historic generation for an Installation
 * @param  {String} installationName
 * @param  {String} redisKey
 */
function queryHistoricSingle(installationName, redisKey) {
  return function(cached) {
    if (cached) {
      return JSON.parse(cached);
    }

    return Generation
      .findAll({
        where: {
          InstallationName: installationName
        },
        attributes: [
          [sequelize.fn('date_format', sequelize.col('datetime'), '%Y-%m-%dT%h:00:00.000Z'), 'date'],
          [sequelize.fn('avg', sequelize.col('generated')), 'generated']
        ],
        group: [
          'date'
        ],
        limit: 100,
        order: 'date DESC'
      })
      .then(Util.cacheResponse(redisKey));
  };
}
