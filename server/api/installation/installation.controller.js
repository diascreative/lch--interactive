/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/installations              ->  index
 * GET     /api/installations/full         ->  adminIndex
 * GET     /api/installations/:name        ->  show
 * GET     /api/installations/:id/full     ->  adminShow
 */

'use strict';

import {Installation, sequelize} from '../../sqldb';
import Util from '../../util';


// Gets a list of Installations
export function index(req, res) {
  const redisKey = `installation--index`;

  return Util.getCache(redisKey)
    .then(queryGetInstallations(redisKey))
    .then(Util.respondWithResult(res))
    .catch(Util.handleError(res));
}

// Gets a single Installation from the DB
export function show(req, res) {
  const name = req.params.name;
  const redisKey = `installation-${name}`;

  return Util.getCache(redisKey)
    .then(queryGetInstallation(name, redisKey))
    .then(Util.respondWithResult(res))
    .catch(Util.handleError(res));
}

export function adminIndex(req, res) {
  return Installation
    .findAll({
      attributes: ['_id', 'name'],
      order: 'name ASC'
    })
    .then(Util.respondWithResult(res))
    .catch(Util.handleError(res));
}

export function adminShow(req, res) {
  const id = req.params.id;

  console.log(id)

  return Installation
    .findOne({
      where: {
        _id: id
      }
    })
    .then(Util.respondWithResult(res))
    .catch(Util.handleError(res));
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
          'url',
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
          'energyType',
          'url'
        ]
      })
      .then(Util.cacheResponse(redisKey, 86400));
  }
}

function queryGetInstallation(name, redisKey) {
  return function(cached) {
    if (cached) {
      return JSON.parse(cached);
    }

    return Installation
      .findOne({
        where: {
          name: name
        },
        attributes: [
          'commissioned',
          'name',
          'location',
          'localAuthority',
          'owner',
          'ownershipType',
          'annualPredictedGeneration',
          'capacity',
          'energyType',
          'source',
          'url'

        ]
      })
      .then(Util.cacheResponse(redisKey, 86400));
  }
}
