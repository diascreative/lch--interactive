'use strict';
(function() {

class FilterComponent {
  constructor(appStats, $scope, $interval) {
    this.$interval = $interval;
    $scope.$ctrl = $scope.$parent.$parent.$ctrl;
    this.appStats = appStats;
    this._randomStat = Math.round(Math.random() * (this.appStats.length - 2)) + 1;
  }

  $onInit() {
    this.$interval(this.newRandomExample.bind(this), 5000);
  }

  getStatExample(indexToShow = this._randomStat) {
    return this.appStats[indexToShow];
  }

  newRandomExample() {
    this._randomStat = Math.round(Math.random() * (this.appStats.length - 2)) + 1;
    return this._randomStat;
  }
}

angular.module('lowcarbonhubApp')
  .component('filter', {
    templateUrl: 'app/filter/filter.html',
    controller: FilterComponent,
    controllerAs: '$filter'
  });

})();
