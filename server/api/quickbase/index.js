'use strict';

var express = require('express');
var controller = require('./quickbase.controller');
import * as auth from '../../auth/auth.service';

var router = express.Router();

router.post('/', auth.hasRole('admin'), controller.index);

module.exports = router;
