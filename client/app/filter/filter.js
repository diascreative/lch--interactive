'use strict';

angular.module('lowcarbonhubApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('filter', {
        url: '/filter',
        template: '<filter></filter>'
      });
  });
