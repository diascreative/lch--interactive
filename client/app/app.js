'use strict';

angular.module('lowcarbonhubApp', [
  'ngResource',
  'ui.router',
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
