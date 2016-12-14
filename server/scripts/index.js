'use strict';

import EMIG from './emig.import';
import OLH from './olh.import';
import RTONE from './rtone.import';

module.exports = importAllData;

function importAllData() {
  OLH.scheduleJobs();
  RTONE.scheduleJobs();
  EMIG.scheduleJobs();
}
