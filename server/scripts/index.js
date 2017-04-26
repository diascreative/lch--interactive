'use strict';

import EMIG from './emig.import';
import OLH from './olh.import';
import RTONE from './rtone.import';
import * as quickbase from './quickbase.export'

export function importAllData() {
  OLH.scheduleJobs();
  RTONE.scheduleJobs();
  EMIG.scheduleJobs();
}

export function updateQuickBase() {
  quickbase.scheduleJobs();
}
