/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/generations              ->  index
 * POST    /api/generations              ->  create
 * GET     /api/generations/latest       ->  latest
 * GET     /api/generations/:id          ->  show
 * PUT     /api/generations/:id          ->  update
 * DELETE  /api/generations/:id          ->  destroy
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

function saveUpdates(updates) {
  return function(entity) {
    return entity.updateAttributes(updates)
      .then(updated => {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function(entity) {
    if (entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
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

export function latest(req, res) {
  var superQuery = `
  SELECT
    MAX(\`datetime\`) AS \`datetime\`,
    SUM(\`generated\`) AS \`generated\`,
    InstallationName
  FROM
      Generations a
      inner join
          (SELECT MAX(\`datetime\`) as \`max_datetime\`, InstallationId FROM \`Generations\` GROUP BY InstallationId) as b on
          a.InstallationId = b.InstallationId AND a.datetime = b.max_datetime
  GROUP BY InstallationName
  ORDER BY InstallationName
  `;

  sequelize.query(superQuery, { type: sequelize.QueryTypes.SELECT})
    .then(respondWithResult(res))
    .catch(handleError(res));

}

// Gets a list of Generations
export function index(req, res) {
  return Generation.findAll()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Generation from the DB
export function show(req, res) {
  return Generation.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Generation in the DB
export function create(req, res) {
  return Generation.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Updates an existing Generation in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return Generation.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Generation from the DB
export function destroy(req, res) {
  return Generation.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
