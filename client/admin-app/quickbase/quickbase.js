'use strict';

angular.module('lowcarbonhubAppAdmin')
  .config(function($stateProvider) {
    $stateProvider
      .state('quickbase', {
        url: '/admin/quickbase',
        template: '<quickbase></quickbase>',
        authenticate: true
      });
  });
