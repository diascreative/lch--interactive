'use strict';
(function() {

class FilterComponent {
  constructor($scope) {
    $scope.message = 'Hello';
    $scope.$ctrl = $scope.$parent.$parent.$ctrl;

    console.log($scope.$parent.$parent.$ctrl)
  }
}

angular.module('lowcarbonhubApp')
  .component('filter', {
    templateUrl: 'app/filter/filter.html',
    controller: FilterComponent
  });

})();
