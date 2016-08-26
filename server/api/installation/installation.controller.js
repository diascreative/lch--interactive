/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/installations              ->  index
 * POST    /api/installations              ->  create
 * GET     /api/installations/:id          ->  show
 * PUT     /api/installations/:id          ->  update
 * DELETE  /api/installations/:id          ->  destroy
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

// Gets a list of Installations
export function index(req, res) {
  const redisKey = `${config.redis.key}::installation--index`;

  return getCache(redisKey)
    .then(queryGetInstallations(redisKey))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Installation from the DB
export function show(req, res) {
  return Generation
    .findAll({
      where: {
        InstallationName: req.params.id
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

function queryGetInstallations(redisKey) {
  return function(cached) {
    if (cached) {
      return JSON.parse(cached);
    }

    return Installation
      .findAll({
        attributes: [
          'name',
          'localAuthority',
          'owner',
          'ownershipType',
          'energyType',
          [sequelize.fn('max', sequelize.col('lat')), 'lat'],
          [sequelize.fn('min', sequelize.col('lng')), 'lng'],
          [sequelize.fn('sum',
                          sequelize.col('annualPredictedGeneration')
                        ), 'annualPredictedGeneration'],
          [sequelize.fn('sum', sequelize.col('capacity')), 'capacity']
        ],
        group: [
          'name',
          'localAuthority',
          'owner',
          'ownershipType',
          'energyType'
        ]
      })
      .then(cacheResponse(redisKey, 86400));
  }
}
