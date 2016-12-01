'use strict';
(function() {

class FilterComponent {
  constructor(appStats, $filter, $interval, $scope) {
    this.$filter = $filter;
    this.$interval = $interval;
    this.appStats = appStats;
    this._randomStat = Math.round(Math.random() * (this.appStats.length - 2)) + 1;

    $scope.$ctrl = $scope.$parent.$parent.$ctrl;
    this.$ctrl = $scope.$ctrl;
  }

  $onInit() {
    this.$interval(this.newRandomExample.bind(this), 5000);
    this.$ctrl.setHash();
  }

  getCO2() {
    // metric tons CO2 / kWh https://www.epa.gov/energy/ghg-equivalencies-calculator-calculations-and-references
    const tonnes = (0.44932 / 1000) * (this.$ctrl.getTotalYearlyGeneration() / 1000);
    const decimals = tonnes < 1 ? 1 : 0;
    const cleanTonnes = this.$filter('number')(tonnes, decimals);
    return `${cleanTonnes} <span class="units">tonnes</span>`;
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
