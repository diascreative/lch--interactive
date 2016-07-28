'use strict';

angular.module('lowcarbonhubApp', [
  'lowcarbonhubApp.auth',
  'lowcarbonhubApp.admin',
  'lowcarbonhubApp.constants',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'validation.match',
  'leaflet-directive'
])
  .config(function($urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
  });
