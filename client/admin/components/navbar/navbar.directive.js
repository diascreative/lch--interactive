'use strict';

angular.module('lowcarbonhubApp')
  .directive('navbar', () => ({
    templateUrl: 'admin/components/navbar/navbar.html',
    restrict: 'E',
    controller: 'NavbarController',
    controllerAs: 'nav'
  }));
