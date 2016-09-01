(function(angular, undefined) {
'use strict';

angular.module('lowcarbonhubApp.constants', [])
  .constant('appStats', [
    {
      consumption: 15907000,
      action: `people's share of Oxfordshire's energy need met`
    },
    {
      // 1800W for 3 mins : 1800 * (3/60) = 90Wh
      consumption: 90,
      action: 'cups of tea'
    },
    {
      // 1200W * (3/60) = 60Wh
      // 60 for 2 slices = 30Wh for each
      consumption: 60,
      action: 'slices of toast'
    },
    {
      // 115W * 1h = 115Wh
      // TV - LCD (Sony Bravia KDL32S3000)
      consumption: 115,
      action: 'hours of telly'
    },
    {
      // page 52 http://www.inference.eng.cam.ac.uk/sustainable/book/tex/sewtha.pdf
      // mentions 0.5kWh per day
      consumption: 500,
      action: 'fridge-freezers for a day'
    }
  ]);
})(angular);
