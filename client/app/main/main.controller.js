'use strict';

(function() {

class MainController {

  constructor($http, $filter, $location) {
    this.$http = $http;
    this.$filter = $filter;
    this.$location = $location;

    this._installations = [];
    this.search = '';

    this.filtersAvailable = {
      localAuthorities: [],
      ownership: [],
      ownershipType: [],
      energyTypes: []
    };

    // set our map variables
    this.map = {
      installations: [],
      defaults: {
        attributionControl: false,
        center: {
          lat: 51.85,
          lng: -1.34,
          zoom: (window.innerWidth > 1100 ? 10 : 9)
        },
        minZoom: 9,
        // tileLayer: 'https://a.tiles.mapbox.com/v4/pirenaq.4122b387/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicGlyZW5hcSIsImEiOiJjaWVtbzl2eXgwMDFuc3Rra3RuaWlnNzMxIn0.HxN1ugyk0JzH46gFnb6mXA'
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
      this.$http.get('/api/generations').then(response => {
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
    this.filtersAvailable = this._installationsToFilters(this._installations);

    return this.map.installations;
  }

  /**
   * Create map markers from installations array
   * @param  {Object} installation
   * @return {Object} map marker
   */
  _installationsToMarkers(installation) {
    const marker = installation;

    marker.draggable = false;
    marker.lat = installation.lat;
    marker.lng = installation.lng;
    marker.message = this._mapPopupHTML(installation);
    marker.visible = true;
    marker.generated = 0;

    marker.icon = {
      type: 'div',
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="45" viewBox="0 0 40 60"><path fill="#00748D" fill-rule="evenodd" d="M20 60s20-28.954305 20-40C40 8.954305 31.045695 0 20 0S0 8.954305 0 20s20 40 20 40zm0-30c5.5228475 0 10-4.4771525 10-10s-4.4771525-10-10-10-10 4.4771525-10 10 4.4771525 10 10 10z"/></svg>',
      iconSize: [30, 45],
      iconAnchor: [15, 45],
      popupAnchor: [0, -24]
    };

    return marker;
  }


  /**
   * Build the filters list from our API data
   * @param  {Array} of Installation objects
   * @return {Array} of filters available
   */
  _installationsToFilters(installations) {
    const filters = this.filtersAvailable;
    const hash = this.$location.hash();

    let savedFilters = [
      [],[],[],[]
     ];

    if (hash.indexOf('::') > -1) {
      const allFilters = hash.split('::');
      if (allFilters.length === 4) {
        savedFilters = allFilters.map(type => type.split('+'));
      }
    }

    // clear out old filters
    _.forEach(filters, function(item, key) {
      filters[key] = [];
    });

    // add all the details
    installations.forEach(installation => {
      filters.localAuthorities.push({
        name: installation.localAuthority,
        checked: savedFilters[0].indexOf(installation.localAuthority) > -1
      });

      filters.ownership.push({
        name: installation.owner,
        checked: savedFilters[1].indexOf(installation.owner) > -1
      });

      filters.ownershipType.push({
        name: installation.ownershipType,
        checked: savedFilters[2].indexOf(installation.ownershipType) > -1
      });

      filters.energyTypes.push({
        name: installation.energyType,
        checked: savedFilters[3].indexOf(installation.energyType) > -1
      });

    });

    // make them unique
    filters.localAuthorities = _.uniqBy(filters.localAuthorities, 'name');
    filters.ownership = _.uniqBy(filters.ownership, 'name');
    filters.ownershipType = _.uniqBy(filters.ownershipType, 'name');
    filters.energyTypes = _.uniqBy(filters.energyTypes, 'name');

    // return the filters
    return filters;
  }

  /**
   * Filter the visibility of our markers
   */
  filterInstallations() {
    // keep tabs if we're not specifically filtering by anything
    const filterByLocalAuthority = this._filteredLocalAuthorities();
    const filterByOwnership = this._filteredOwnerships();
    const filterByOwnershipType = this._filteredOwnershipTypes();
    const filterByEnergyType = this._filteredEnergyTypes();

    const newHash = filterByLocalAuthority.join('+') + '::' +
                  filterByOwnership.join('+') + '::' +
                  filterByOwnershipType.join('+') + '::' +
                  filterByEnergyType.join('+');

    const freeText = this.search !== '';
    const searchRegExp = new RegExp(this.search, 'i');

    this.$location.hash(newHash);

    return this.map.installations.map(installationMarker => {
      const inLas = !filterByLocalAuthority.length ||
                  (filterByLocalAuthority.indexOf(installationMarker.localAuthority) > -1);
      const belongsTo = !filterByOwnership.length ||
                       (filterByOwnership.indexOf(installationMarker.owner) > -1);
      const ownershipType = !filterByOwnershipType.length ||
                       (filterByOwnershipType.indexOf(installationMarker.ownershipType) > -1);
      const energyType = !filterByEnergyType.length ||
                       (filterByEnergyType.indexOf(installationMarker.energyType) > -1);

      const nameMatches = !freeText || installationMarker.name.search(searchRegExp) > -1;

      const visible = inLas && belongsTo && ownershipType && energyType && nameMatches;

      installationMarker.visible = visible;
      installationMarker.icon.className = visible ? '' : 'leaflet-marker-icon--hidden';
    });
  }

  /**
   * Get all the names of the Local Authorities we're filtering by
   * @return {Array} names of the LAs
   */
  _filteredLocalAuthorities() {
    return _.chain(this.filtersAvailable.localAuthorities)
            .filter(la => la.checked)
            .map(la => la.name)
            .value();
  }

  /**
   * Get all the names of the owners we're filtering by
   * @return {Array} names of the owners
   */
  _filteredOwnerships() {
    return _.chain(this.filtersAvailable.ownership)
            .filter(owner => owner.checked)
            .map(owner => owner.name)
            .value();
  }

  /**
   * Get all the names of the ownership types we're filtering by
   * @return {Array} names of the ownerships
   */
  _filteredOwnershipTypes() {
    return _.chain(this.filtersAvailable.ownershipType)
            .filter(type => type.checked)
            .map(type => type.name)
            .value();
  }

  /**
   * Get all the names of the energy types we're filtering by
   * @return {Array} names of the energy types
   */
  _filteredEnergyTypes() {
    return _.chain(this.filtersAvailable.energyTypes)
            .filter(type => type.checked)
            .map(type => type.name)
            .value();
  }

  /**
   * Build HMTL for the map marker pop up
   * @param  {Object} installation
   * @return {String} html
   */
  _mapPopupHTML(installation) {
    const cleanNumbers = {
      name: installation.name,
      capacity: this.$filter('number')(installation.capacity, 0),
      annualPredictedGeneration: this.$filter('number')(installation.annualPredictedGeneration, 0),
      generated: this.$filter('number')(installation.generated / 1000, 0)
    };

    if (installation.datetime) {
      cleanNumbers.datetime = moment(installation.datetime).fromNow();
    }

    const html = [
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
    const visibleInstallations = this._getVisibleInstallations();
    const total = _.sumBy(visibleInstallations, 'generated');

    return this.$filter('number')(total, 0);
  }

  /**
   * Get the number of visible installations
   * @return {String} $filtered total
   */
  getFilteredInstallations() {
    const total = this._getVisibleInstallations().length;

    return this.$filter('number')(total, 0);
  }

  /**
   * Build stats copy about the chosen areas
   * @return {String}
   * eg. "Oxfordshire"
   *     "Cherwell District Council"
   *     "your 2 chosen districts"
   */
  copyArea() {
    const types = this._filteredLocalAuthorities();

    if (types.length > 1) {
      return `your ${types.length} chosen districts`;
    }

    const str = this._addValuesAsString(types, 'Oxfordshire', 1);

    return str;
  }

  /**
   * Build stats copy about the chosen ownership types
   * @return {String}
   * eg. "Commnity"
   *     "community and council"
   */
  copyOwnershipType() {
    const types = this._filteredOwnershipTypes();
    const str = this._addValuesAsString(types, '');

    return str + ' energy';
  }

  _addValuesAsString(values, fallback) {
    if (!values.length) {
      return fallback;
    }

    if (values.length === 1) {
      return values[0];
    }

    const lastItem = _.last(values);
    const string = _.initial(values)
                  .join(', ');

    return string + ' and ' + lastItem;

  }

  /**
   * Import GeoJSON with the Oxfordshire boarders to highlight it on the map
   * @return {Promise}
   */
  _importGeoJSON() {
    // Get the countries geojson data from a JSON
    return this.$http.get('/assets/json/topo_E07000178.json')
            .success(data => {
              this.map.geojson = {
                data: data,
                style: {
                  fillColor: 'red',
                  weight: 1,
                  opacity: 0.8,
                  color: 'red',
                  fillOpacity: 0.05
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
