'use strict';

angular.module('lowcarbonhubAppAdmin')
  .directive('navbar', () => ({
    templateUrl: 'admin-app/components/navbar/navbar.html',
    restrict: 'E',
    controller: 'NavbarController',
    controllerAs: 'nav'
  }));
