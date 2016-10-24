'use strict';

var express = require('express');
import * as auth from '../../auth/auth.service';
var controller = require('./installation.controller');

var router = express.Router();

router.get('/', controller.index);
router.post('/', auth.hasRole('admin'), controller.uploadCSV);
router.get('/sources', auth.hasRole('admin'), controller.sources);
router.get('/full', auth.hasRole('admin'), controller.adminIndex);
router.get('/:id/full', auth.hasRole('admin'), controller.adminShow);
router.get('/:name', controller.show);
router.post('/:id', auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

module.exports = router;
