'use strict';

angular.module('lowcarbonhubAppAdmin')
  .config(function($stateProvider) {
    $stateProvider
      .state('installations', {
        url: '/admin/installations',
        template: '<installations></installations>',
        authenticate: true
      });
  });
