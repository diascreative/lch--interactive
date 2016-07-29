'use strict';

(function() {

class MainController {

  constructor($http, $filter) {
    this.$http = $http;
    this.$filter = $filter;

    this.installations = [];

    // set our map variables
    this.map = {
      installations: [],
      defaults: {
        attributionControl: false,
        center: {
          lat: 51.85,
          lng: -1.26,
          zoom: 10
        },
        zoomControlPosition: 'bottomright',
        scrollWheelZoom: false
      }
    };
  }

  $onInit() {
    this.$http.get('/api/installations').then(response => {
      this._installations = response.data;
      this.map.installations = this._installations.map(this._mapInstallationsToMarkers.bind(this));

      this.$http.get('/api/generations/latest').then(response => {
        _.each(response.data, (gen) => {
          _.each(this._installations, (installation) => {
            if (installation.name === gen.InstallationName) {
              installation.generated = gen.generated;
              installation.datetime = gen.datetime;
            }
          });
        });

        this.map.installations = this._installations.map(this._mapInstallationsToMarkers.bind(this));
      });
    });
  }

  /**
   * Create map markers from installations array
   * @param  {Object} installation
   * @return {Object} map marker
   */
  _mapInstallationsToMarkers(installation) {
    var marker = {
      draggable: false,
      lat: installation.lat,
      lng: installation.lng,
      message: this._mapPopupHTML(installation)
    };

    return marker;
  }

  /**
   * Build HMTL for the map marker pop up
   * @param  {Object} installation
   * @return {String} html
   */
  _mapPopupHTML(installation) {
    var cleanNumbers = {
      name: installation.name,
      capacity: this.$filter('number')(installation.capacity, 0),
      annualPredictedGeneration: this.$filter('number')(installation.annualPredictedGeneration, 0),
      generated: this.$filter('number')(installation.generated / 1000, 0)
    };

    if (installation.datetime) {
      cleanNumbers.datetime = moment(installation.datetime).fromNow();
    }

    var html = [
      '<div>',
        '<h2>%(name)s</h2>',
        'capacity: <strong>%(capacity)s</strong> kW',
        '<br>annual predicted generation: <strong>%(annualPredictedGeneration)s</strong> kW',
        cleanNumbers.generated ? '<br>Was generating <strong>%(generated)s</strong> kW' : '',
        cleanNumbers.datetime ? ', %(datetime)s' : '',
      '</div>'
    ].join('');

    return sprintf(html, cleanNumbers);
  }
}

angular.module('lowcarbonhubApp')
  .component('main', {
    templateUrl: 'app/main/main.html',
    controller: MainController
  });

})();
