'use strict';

angular.module('lowcarbonhubAppAdmin.auth', [
  'lowcarbonhubAppAdmin.constants',
  'lowcarbonhubAppAdmin.util',
  'ngCookies',
  'ui.router'
])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
