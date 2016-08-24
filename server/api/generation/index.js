'use strict';

var express = require('express');
var controller = require('./generation.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/historic', controller.historic);
router.get('/historic/:name', controller.historicSingle);

module.exports = router;
