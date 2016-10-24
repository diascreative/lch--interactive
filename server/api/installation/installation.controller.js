/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/installations              ->  index
 * GET     /api/installations/:name        ->  show
 * GET     /api/installations/full         ->  adminIndex
 * POST    /api/installations              ->  uploadCSV
 * DELETE  /api/installations/:id          ->  destroy
 * POST    /api/installations/:id          ->  update
 * GET     /api/installations/:id/full     ->  adminShow
 * GET     /api/installations/sources      ->  sources
 */

'use strict';

import csv from 'csv';
import formidable from 'formidable';
import fs from 'fs';
import _ from 'lodash';
import {Installation, sequelize} from '../../sqldb';
import Util from '../../util';

/**
 * Get list of all our installations
 */
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

/**
 * Upload a CSV which inserts new Installations and edits existing ones
 * restriction: 'admin'
 */
export function uploadCSV(req, res) {
  const form = new formidable.IncomingForm();

  form.parse(req);

  form.on('file', function(field, file) {
    if (file.type !== 'text/csv') {
      return Util.handleError(res)
    }

    const readStream = fs.createReadStream(file.path);

    readStream.on('data', function(data) {
      readStream.pause();

      csv.parse(data.toString(), { delimiter: ','}, function(err, output) {
        const installations = _
          .chain(output)
          .filter(i => (i[0] !== '' && i[0] !== ''))
          .map(i => {
            return {
              _id: parseInt(i[0]),
              name: i[1],
              lat: parseFloat(i[2]),
              lng: parseFloat(i[3]),
              localAuthority: i[4],
              owner: i[5],
              ownershipType: i[6],
              annualPredictedGeneration: i[7],
              capacity: i[8],
              energyType: i[9],
              source: i[10],
              commissioned: i[11],
              location: i[12],
              url: i[13]
            }
          })
          .value();

        return Installation.bulkCreate(installations, {
            updateOnDuplicate: [
              'name',
              'localAuthority',
              'lat',
              'lng',
              'owner',
              'ownershipType',
              'annualPredictedGeneration',
              'capacity',
              'energyType',
              'source',
              'commissioned',
              'location',
              'url'
            ]
          })
          .then(Util.clearCache())
          .then(Util.respondWithResult(res))
          .catch(Util.handleError(res));
      });
    });
  });
}

/**
 * Deletes an installation
 * restriction: 'admin'
 */
export function destroy(req, res) {
  return Installation
      .destroy({
        where: {
          _id: req.params.id
        }
      })
      .then(function() {
        res.status(204).end();
      })
      .catch(Util.handleError(res));
}

/**
 * Updates an installation
 * restriction: 'admin'
 */
export function update(req, res) {
  const installationId = req.params.id;

  return Installation
    .update({
      'name': req.body.name,
      'lat': req.body.lat,
      'lng': req.body.lng,
      'localAuthority': req.body.localAuthority,
      'owner': req.body.owner,
      'ownershipType': req.body.ownershipType,
      'annualPredictedGeneration': req.body.annualPredictedGeneration,
      'capacity': req.body.capacity,
      'energyType': req.body.energyType,
      'commissioned': req.body.commissioned,
      'source': req.body.source,
      'info': req.body.info,
      'location': req.body.location,
      'url': req.body.url
    }, {
      where: {
        _id: installationId
      }
    })
    .then(Util.respondWithResult(res))
    .catch(Util.handleError(res));
}

/**
 * Gets a list of possible sources for an installaiton
 * restriction: 'admin'
 */
export function sources(req, res) {
  return Installation
    .findAll({
      attributes: ['source'],
      group: ['source'],
      order: 'source ASC'
    })
    .then(Util.respondWithResult(res))
    .catch(Util.handleError(res));
}

/**
 * Get full installation information
 * restriction: 'admin'
 */
export function adminShow(req, res) {
  const id = req.params.id;

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
          [sequelize.fn('max', sequelize.col('commissioned')), 'commissioned'],
          [sequelize.fn('max', sequelize.col('location')), 'location'],
          'name',
          'localAuthority',
          'owner',
          'ownershipType',
          [sequelize.fn('sum',
                          sequelize.col('lastIndex')
                        ), 'lastIndex'],
          [sequelize.fn('sum',
                          sequelize.col('annualPredictedGeneration')
                        ), 'annualPredictedGeneration'],
          [sequelize.fn('sum', sequelize.col('capacity')), 'capacity'],
          'energyType',
          'source',
          'url'
        ],
        group: [
          'name',
          'localAuthority',
          'owner',
          'ownershipType',
          'energyType',
          'source',
          'url'
        ]
      })
      .then(Util.cacheResponse(redisKey, 86400));
  }
}
