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
    const tonnes = (7.03 * 0.0001) * (this.$ctrl.getTotalYearlyGeneration() / 1000);
    const decimals = tonnes < 1 ? 1 : 0;
    const cleanTonnes = this.$filter('number')(tonnes, decimals);
    return `${cleanTonnes} <span class="units">Tonnes</span>`;
  }

  getStatExample(indexToShow = this._randomStat) {
    return this.appStats[indexToShow];
  }

  newRandomExample() {
    this._randomStat = Math.round(Math.random() * (this.appStats.length - 2)) + 1;
    return this._randomStat;
  }


  /**
   * Build stats copy about the chosen areas
   * @return {String}
   * eg. "Oxfordshire"
   *     "Cherwell District Council"
   *     "your 2 chosen districts"
   */
  copyArea() {
    const str = this.$ctrl.filtersChosen.localAuthorities === 'all' ? 'Oxfordshire' :
                                this.$ctrl.filtersChosen.localAuthorities;

    return `In <strong>${str}</strong>`;
  }

  /**
   * Build stats copy about the chosen ownership
   * @return {String}
   * eg. "Low Carbon Hub"
   *     "community and council"
   */
  copyOwnership() {
    if (this.$ctrl.filtersChosen.ownership === 'all') {
      return;
    }

    return `, owned by <strong>${this.$ctrl.filtersChosen.ownership}</strong>`;
  }

  /**
   * Build stats copy about the chosen ownership types
   * @return {String}
   * eg. "Commnity"
   *     "community and council"
   */
  copyOwnershipType() {
    if (this.$ctrl.filtersChosen.ownershipType === 'all') {
      return;
    }

    return this.$ctrl.filtersChosen.ownershipType.toLowerCase();
  }

  /**
   * Build stats copy about the chosen energy types
   * @return {String}
   * eg. "hydro"
   *     "solar pv"
   */
  copyEnergyType() {
    if (this.$ctrl.filtersChosen.energyType === 'all') {
      return;
    }

    return this.$ctrl.filtersChosen.energyType.toLowerCase();
  }
}

angular.module('lowcarbonhubApp')
  .component('filter', {
    templateUrl: 'app/filter/filter.html',
    controller: FilterComponent,
    controllerAs: '$filter'
  });

})();
