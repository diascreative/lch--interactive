'use strict';

angular.module('lowcarbonhubApp.auth', [
  'lowcarbonhubApp.constants',
  'lowcarbonhubApp.util',
  'ngCookies',
  'ui.router'
])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
