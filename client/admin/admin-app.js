'use strict';

angular.module('lowcarbonhubApp', [
  'lowcarbonhubApp.auth',
  'lowcarbonhubApp.constants',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'validation.match'
])
  .config(function($urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/admin/login');

    $locationProvider
      .hashPrefix(false)
      .html5Mode(true);
  });
