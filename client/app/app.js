'use strict';

angular.module('lowcarbonhubApp', [
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.select',
  'chart.js',
  'validation.match',
  'leaflet-directive'
])
  .config(function($urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider
      .hashPrefix(false)
      .html5Mode(true);
  });
