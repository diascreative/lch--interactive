'use strict';

(function() {

class MainController {

  constructor($http, $filter) {
    this.$http = $http;
    this.$filter = $filter;

    this._installations = [];

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
    // API call to get the array of installations
    this.$http.get('/api/installations').then(response => {
      this._installations = response.data;
      this.map.installations = this._installations.map(this._installationsToMarkers.bind(this));

      // API call to get latest generating details
      this.$http.get('/api/generations/latest').then(response => {
        _.each(response.data, (gen) => {
          _.each(this._installations, (installation) => {
            if (installation.name === gen.InstallationName) {
              installation.generated = gen.generated;
              installation.datetime = gen.datetime;
            }
          });
        });

        this._updateMapMarkers();
      });
    });

    this._importGeoJSON();
  }

  /**
   * Update map markers from this._installations
   * @return {Array} Map markers
   */
  _updateMapMarkers() {
    this.map.installations = this._installations.map(this._installationsToMarkers.bind(this));

    return this.map.installations;
  }

  /**
   * Create map markers from installations array
   * @param  {Object} installation
   * @return {Object} map marker
   */
  _installationsToMarkers(installation) {
    var marker = installation;

    marker.draggable = false;
    marker.lat = installation.lat;
    marker.lng = installation.lng;
    marker.message = this._mapPopupHTML(installation);
    marker.visible = true;

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

  /**
   * Return only visible installations
   * @return {Array} Visible installations
   */
  _getVisibleInstallations() {
    return _.filter(this.map.installations, installation => installation.visible);
  }

  /**
   * Get the total generation from the visible installations
   * @return {String} $filtered sum
   */
  getFilteredTotalGeneration() {
    let visibleInstallaitons = this._getVisibleInstallations();
    let total = _.sumBy(visibleInstallaitons, 'generated');

    return this.$filter('number')(total / 1000, 0);
  }

  /**
   * Get the number of visible installations
   * @return {String} $filtered total
   */
  getFilteredInstallations() {
    let total = this._getVisibleInstallations().length;

    return this.$filter('number')(total, 0);
  }

  /**
   * Import GeoJSON with the Oxfordshire boarders to highlight it on the map
   * @return {Promise}
   */
  _importGeoJSON() {
    // Get the countries geojson data from a JSON
    return this.$http.get('assets/json/topo_E07000178.json')
            .success(data => {
              this.map.geojson = {
                data: data,
                style: {
                  fillColor: 'red',
                  weight: 1,
                  opacity: 0.8,
                  color: 'red',
                  fillOpacity: 0.1
                }
              };
            });
  }
}

angular.module('lowcarbonhubApp')
  .component('main', {
    templateUrl: 'app/main/main.html',
    controller: MainController
  });

})();
