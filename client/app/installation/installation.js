'use strict';

angular.module('lowcarbonhubApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('installation', {
        url: '/installation/:name',
        template: '<installation></installation>'
      });
  });
