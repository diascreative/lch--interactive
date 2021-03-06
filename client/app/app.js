'use strict';

const titles = document.getElementsByClassName('page-title');
const descriptions = document.getElementsByClassName('page-description');

for (let i = 0, length = titles.length; i < length; i++) {
  titles[i].setAttribute('content', '{{$ctrl.pageTitle()}}');
}

for (let i = 0, length = descriptions.length; i < length; i++) {
  descriptions[i].setAttribute('content', '{{$ctrl.pageDescription()}}');
}

angular.module('lowcarbonhubApp', [
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.select',
  '720kb.socialshare',
  'chart.js',
  'validation.match',
  'leaflet-directive',
  'lowcarbonhubApp.constants'
])
  .run(function($filter, $rootScope) {
    /**
     * Pretty-print watt
     * @param  {Integer} watts
     * @param  {Boolean} force a particular unit
     * @return {String} pretty-printed reading
     */
    $rootScope.watts = function(watt, forcedUnit = false, hours = '', wrapUnits = true) {
      let unit = 'W';
      let decimalPlaces = 2;
      let returnWatt = watt;

      forcedUnit = 'kW';

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

      if (wrapUnits) {
        return `${cleanWatt}&nbsp;<span class="units">${unit}${hours}</span>`;
      } else {
        return `${cleanWatt} ${unit}${hours}`;
      }

    };
  })
  .config(function($urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider
      .hashPrefix(false)
      .html5Mode(true);
  });
