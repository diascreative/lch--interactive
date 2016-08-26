/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/generations              ->  index
 * GET     /api/generations/historic     ->  historic
 * GET     /api/generations/historic/:id     ->  singleHistoric
 */

'use strict';

const bluebird = require('bluebird');
import {Installation, Generation, sequelize} from '../../sqldb';
import config from '../../config/environment';
import redisClient from '../../redis';

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

/**
 * Check if we have cached an API response
 * @param  {String} redisKey
 * @return {Promise}
 */
function getCache(redisKey) {
  if (!config.redis.enabled) {
    return bluebird.delay(1);
  }

  return redisClient.getAsync(redisKey)
}

/**
 * Cache an API response
 * @param  {String} redisKey
 * @param  {Number}  cacheExpiry
 * @return {Array} Respose
 */
function cacheResponse(redisKey=false, cacheExpiry=900) {
  return function(entity) {
    if (redisKey && entity) {
      redisClient.set(redisKey, JSON.stringify(entity));
      redisClient.expire(redisKey, cacheExpiry);
    }

    return entity;
  }
}

/**
 * /api/generations
 * Return the latest generation data for all installations
 */
export function index(req, res) {
  const redisKey = `${config.redis.key}::generation--index`;

  return getCache(redisKey)
    .then(queryLiveGenerations(redisKey))
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));

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

  const redisKey = `${config.redis.key}::generation--historic-${localAuthorities}-${owner}-${ownershipType}-${energyType}`;

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

  return getCache(redisKey)
    .then(queryHistoricMultiple(whereFilter, redisKey))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

/**
 * /api/generations/historic/:id
 * Gets the historic data for an installation
 */
export function historicSingle(req, res) {
  const installationName = req.params.name;
  const redisKey = `${config.redis.key}::generation--installation-${installationName}`;

  return getCache(redisKey)
    .then(queryHistoricSingle(installationName, redisKey))
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
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
      .then(cacheResponse(redisKey));
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
    .then(cacheResponse(redisKey));
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
          'datetime',
          [sequelize.fn('sum', sequelize.col('generated')), 'generated']
        ],
        group: [
          'datetime'
        ],
        limit: 100,
        order: 'datetime DESC'
      })
      .then(cacheResponse(redisKey));
  };
}
