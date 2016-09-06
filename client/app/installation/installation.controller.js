'use strict';

(function() {

class InstallationComponent {
  constructor(appStats, graphDefault, $interval, $http, $location, $rootScope, $state) {
    this.$interval = $interval;
    this.$http = $http;
    this.$rootScope = $rootScope;
    this.watts = $rootScope.watts;
    this.appStats = appStats;

    this.details = {};
    this.name = $state.params.name;
    this._randomStat = Math.round(Math.random() * (this.appStats.length - 2)) + 1;

    this.lnk = `${$location.protocol()}://${$location.host()}/installation/${encodeURI(this.name)}`;

    this.$rootScope.title = this.name;

    this.graph = angular.copy(graphDefault);
  }

  $onInit() {
    const url = `/api/installations/${this.name}`;

    this.$http.get(url).then(response => {
      this.details = response.data;

      this.setPageDescription();
    });

    this.loadGraphData();

    this.$interval(this.newRandomExample.bind(this), 5000);
  }

  loadGraphData() {
    const url = `/api/generations/historic/${this.name}`;

    return this.$http.get(url)
            .success(data => {
              data.reverse();

              this.graph.labels = data.map(item => {
                return item.date;
              });

              this.graph.data = data.map(item => {
                return item.generated;
              });
            });
  }

  getStatExample(indexToShow = this._randomStat) {
    return this.appStats[indexToShow];
  }

  newRandomExample() {
    this._randomStat = Math.round(Math.random() * (this.appStats.length - 2)) + 1;
    return this._randomStat;
  }

  getAnnualGeneration() {
    return this.watts(this.details.annualPredictedGeneration, false, 'h');
  }

  getCapacity() {
    return this.watts(this.details.capacity);
  }

  socialMessage() {
    const cleanGen = this.watts(this.details.annualPredictedGeneration, false, 'h', false);
    return `${this.name} generates ${cleanGen} clean energy for #Oxon p.a. ` +
           `Find out more at #PeoplesPowerStation`;
  }

  setPageDescription() {
    const cleanGen = this.watts(this.details.annualPredictedGeneration, false, 'h', false);
    this.$rootScope.description = `${this.name} generates ${cleanGen} clean energy for #Oxon p.a.` +
                                  ` What's plugged into the #PeoplesPowerStation near you?`;
  }
}

angular.module('lowcarbonhubApp')
  .component('installation', {
    templateUrl: 'app/installation/installation.html',
    controller: InstallationComponent,
    controllerAs: '$installation'
  });

})();
