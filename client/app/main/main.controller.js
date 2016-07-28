'use strict';

(function() {

class MainController {

  constructor($http, $filter) {
    this.$http = $http;
    this.$filter = $filter;

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
      this.map.installations = response.data.map(this._mapInstallationsToMarkers.bind(this));
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
      annualPredictedGeneration: this.$filter('number')(installation.annualPredictedGeneration, 0)
    };

    var html = [
      '<div>',
        '<h2>%(name)s</h2>',
        'capacity: %(capacity)s',
        '<br>annual predicted generation: %(annualPredictedGeneration)s',
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
