'use strict';

angular.module('lowcarbonhubApp', [
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.select',
  '720kb.socialshare',
  'chart.js',
  'validation.match',
  'leaflet-directive'
])
  .run(function($filter, $rootScope) {
    /**
     * Pretty-print watt
     * @param  {Integer} watts
     * @param  {Boolean} force a particular unit
     * @return {String} pretty-printed reading
     */
    $rootScope.watts = function(watt, forcedUnit = false, hours = '') {
      let unit = 'W';
      let decimalPlaces = 2;
      let returnWatt = watt;

      if (forcedUnit && forcedUnit === 'W') {

      } else if (forcedUnit && forcedUnit === 'kW') {
        returnWatt = watt / 1000;
        unit = 'kW';
      } else {
        // not forcing any units
        if (watt > 250000) {
          returnWatt = watt / 1000000;
          unit = 'MW';
        } else if (watt > 4000) {
          returnWatt = watt / 1000;
          unit = 'kW';
        }
      }

      if (returnWatt > 10 || unit === 'W') {
        decimalPlaces = 0;
      }

      const cleanWatt = $filter('number')(returnWatt, decimalPlaces);
      return `${cleanWatt} <span class="units">${unit}${hours}</span>`;
    };
  })
  .config(function($urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider
      .hashPrefix(false)
      .html5Mode(true);
  });
