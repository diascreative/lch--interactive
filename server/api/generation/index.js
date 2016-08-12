'use strict';

var express = require('express');
var controller = require('./generation.controller');

var router = express.Router();

router.get('/', controller.index);

module.exports = router;
