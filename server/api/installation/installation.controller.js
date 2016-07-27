/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/installations              ->  index
 * POST    /api/installations              ->  create
 * GET     /api/installations/:id          ->  show
 * PUT     /api/installations/:id          ->  update
 * DELETE  /api/installations/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import {Installation} from '../../sqldb';

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

// Gets a list of Installations
export function index(req, res) {
  return Installation.findAll()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Installation from the DB
export function show(req, res) {
  return Installation.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Installation in the DB
export function create(req, res) {
  return Installation.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Updates an existing Installation in the DB
export function update(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return Installation.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Installation from the DB
export function destroy(req, res) {
  return Installation.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
