'use strict';

import _ from 'lodash';
import {Generation} from '../sqldb';

import RTONE from './rtone.import';

module.exports = importAllData;

function importAllData() {
  RTONE.scheduleJobs();
}
