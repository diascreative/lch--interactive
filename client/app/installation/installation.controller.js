'use strict';

(function() {

class InstallationComponent {
  constructor($http, $rootScope, $state) {
    this.$http = $http;
    this.$rootScope = $rootScope;
    this.watts = $rootScope.watts;

    this.details = {};
    this.name = $state.params.name;

    this.$rootScope.title = this.name;

    this.graph = {
      colors: ['#ffffff'],
      data: [],
      labels: [],
      series: ['Series A'],
      pointRadius: 0,
      options: {
        elements: {
          line: {
            borderWidth: 0
          },
          point: {
            radius: 0
          }
        },
        scales: {
          xAxes: [{
            beginAtZero: false,
            ticks: {
              scaleLineColor: '#ffffff',
              fontColor: '#fff',
              callback: function(value) {
                return moment(value).fromNow();
              },
              maxTicksLimit: 7
            },
            gridLines: {
              display: false
            }
          }],
          yAxes: [{
            beginAtZero: false,
            ticks: {
              fontColor: '#fff',
              callback: function(value) {
                return value / 1000;
              }
            },
            gridLines: {
              display: false
            }
          }]
        }
      }
    };
  }

  $onInit() {
    const url = `/api/installations/${this.name}`;

    this.$http.get(url).then(response => {
      this.details = response.data;
    });

    this.loadGraphData();
  }

  loadGraphData() {
    const url = `/api/generations/historic/${this.name}`;

    return this.$http.get(url)
            .success(data => {
              data.reverse();

              this.graph.labels = data.map(item => {
                return item.datetime;
              });

              this.graph.data = data.map(item => {
                return item.generated;
              });
            });
  }

  getAnnualGeneration() {
    return this.watts(this.details.annualPredictedGeneration, false, 'h');
  }

  getCapacity() {
    return this.watts(this.details.capacity);
  }
}

angular.module('lowcarbonhubApp')
  .component('installation', {
    templateUrl: 'app/installation/installation.html',
    controller: InstallationComponent,
    controllerAs: '$installation'
  });

})();
