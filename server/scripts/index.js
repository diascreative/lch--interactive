'use strict';

import EMIG from './emig.import';
import OLH from './olh.import';
import RTONE from './rtone.import';
import * as quickbase from './quickbase.export'

  OLH.scheduleJobs();
export function importAllData() {
  RTONE.scheduleJobs();
  EMIG.scheduleJobs();
}

export function updateQuickBase() {
  quickbase.scheduleJobs();
}
