/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/installations              ->  index
 * POST    /api/installations              ->  create
 * GET     /api/installations/:id          ->  show
 * PUT     /api/installations/:id          ->  update
 * DELETE  /api/installations/:id          ->  destroy
 */

'use strict';

import {Installation, Generation, sequelize} from '../../sqldb';
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
    .then(Util.handleEntityNotFound(res))
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
      .then(Util.cacheResponse(redisKey, 86400));
  }
}
