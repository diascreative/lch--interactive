'use strict';

(function() {

class MainController {

  constructor($http, $filter, $location, $scope, $timeout) {
    this.$http = $http;
    this.$filter = $filter;
    this.$location = $location;
    this.$timeout = $timeout;
    this.$scope = $scope;

    this._installations = [];
    this.search = '';
    this.filterLocation = false;

    this.filtersAvailable = {
      localAuthorities: [],
      ownership: [],
      ownershipType: [],
      energyTypes: []
    };

    this.filtersChosen = {
      localAuthorities: 'all',
      ownership: 'all',
      ownershipType: 'all',
      energyType: 'all'
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
        tileLayer: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        // tileLayer: 'http://{s}.tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png',
        zoomControlPosition: 'bottomright',
        scrollWheelZoom: false
      }
    };
  }

  $onInit() {

    this._setSavedFilters();

    // API call to get the array of installations
    this.$http.get('/api/installations').then(response => {
      this._installations = response.data;

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
        this.filterInstallations();
        this.loadAreaJSON(this.filtersChosen.localAuthorities);
      });
    });

    if (!L.Browser.touch) {
      this.$scope.$on('leafletDirectiveMarker.mouseover', this.mouseOverMarker.bind(this));
      this.$scope.$on('leafletDirectiveMarker.mouseout', this.mouseOutMarker.bind(this));
      // this.$on('leafletDirectiveMarker.click', this.clickMarker);
    }
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
    marker.visible = false;

    if (!marker.generated) {
      marker.generated = 0;
    }

    marker.icon = {
      type: 'div',
      html: '',
      iconSize: [30, 45],
      iconAnchor: [15, 45],
      popupAnchor: [0, -45]
    };

    return marker;
  }

  _setSavedFilters() {
    const hash = this.$location.hash();
    const allFilters = hash.split('::');

    if (allFilters.length !== 4) {
      return;
    }

    this.filtersChosen = {
      localAuthorities: allFilters[0],
      ownership: allFilters[1],
      ownershipType: allFilters[2],
      energyType: allFilters[3]
    };
  }


  /**
   * Build the filters list from our API data
   * @param  {Array} of Installation objects
   * @return {Array} of filters available
   */
  _installationsToFilters(installations) {
    const filters = this.filtersAvailable;

    // clear out old filters
    _.forEach(filters, function(item, key) {
      filters[key] = [];
    });

    // add all the details
    installations.forEach(installation => {
      filters.localAuthorities.push({
        name: installation.localAuthority
      });

      filters.ownership.push({
        name: installation.owner
      });

      filters.ownershipType.push({
        name: installation.ownershipType
      });

      filters.energyTypes.push({
        name: installation.energyType
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

  filterFreeText(installation=false) {
    this.search = installation ? installation.name : '';

    return this.filterInstallations();
  }

  /**
   * Filter the visibility of our markers
   */
  filterInstallations() {
    // keep tabs if we're not specifically filtering by anything
    const newHash = this.filtersChosen.localAuthorities + '::' +
                    this.filtersChosen.ownership + '::' +
                    this.filtersChosen.ownershipType + '::' +
                    this.filtersChosen.energyType;

    const freeText = this.search !== '';
    const searchRegExp = new RegExp(this.search, 'i');

    const visibleItems = [];

    this.$location.hash(newHash);

    this.map.installations.map((installationMarker, index) => {
      const inLas = this.isInCurrentLocalAuthority(installationMarker);
      const belongsTo = this.belongsTo(installationMarker);
      const ownershipType = this.hasOwnerShipType(installationMarker);
      const energyType = this.hasEnergyType(installationMarker);
      const nameMatches = !freeText || installationMarker.name.search(searchRegExp) > -1;

      let visible = (freeText && nameMatches) ||
                      (!freeText && inLas && belongsTo && ownershipType && energyType);

      if (visible && this.filterLocation) {
        // only check the distance if it's visible
        const distance = this._getDistanceFromLatLonInKm(installationMarker.lat,
                                                  installationMarker.lng,
                                                  this.filterLocation.lat,
                                                  this.filterLocation.lng);

        if (distance > 10) {
          visible = false;
        }
      }

      if (visible) {
        visibleItems.push(index);
      }

      installationMarker.visible = visible;
      installationMarker.focus = false;
      installationMarker.icon.className = visible ? '' : 'leaflet-marker-icon--hidden';
    });

    if (visibleItems.length === 1) {
      const marker = this.map.installations[visibleItems[0]];
      marker.focus = true;

      this.map.defaults.center.lat = marker.lat;
      this.map.defaults.center.lng = marker.lng;
    }
  }

  /**
   * Check if an installation is in the current local authority
   * @param  {Object} installation
   * @return {[type]}              [description]
   */
  isInCurrentLocalAuthority(installation) {
    if (this.filtersChosen.localAuthorities === 'all') {
      return true;
    }

    return this.filtersChosen.localAuthorities === installation.localAuthority;
  }

  /**
   * Check if an installation is in the current local authority
   * @param  {Object} installation
   * @return {Boolean}
   */
  belongsTo(installation) {
    if (this.filtersChosen.ownership === 'all') {
      return true;
    }

    return this.filtersChosen.ownership === installation.owner;
  }

  /**
   * Check if an installation is in the current local authority
   * @param  {Object} installation
   * @return {Boolean}
   */
  hasOwnerShipType(installation) {
    if (this.filtersChosen.ownershipType === 'all') {
      return true;
    }

    return this.filtersChosen.ownershipType === installation.ownershipType;
  }

  /**
   * Check if an installation is in the current local authority
   * @param  {Object} installation
   * @return {Boolean}
   */
  hasEnergyType(installation) {
    if (this.filtersChosen.energyType === 'all') {
      return true;
    }

    return this.filtersChosen.energyType === installation.energyType;
  }

  /**
   * Build HMTL for the map marker pop up
   * @param  {Object} installation
   * @return {String} html
   */
  _mapPopupHTML(installation) {
    const cleanNumbers = {
      name: installation.name,
      capacity: this.watts(installation.capacity),
      annualPredictedGeneration: this.watts(installation.annualPredictedGeneration) + 'h',
      generated: this.watts(installation.generated)
    };

    if (installation.datetime) {
      cleanNumbers.datetime = moment(installation.datetime).fromNow();
    }

    const html = [
      '<div>',
        '<h2>%(name)s</h2>',
        'capacity: <strong>%(capacity)s</strong>',
        '<br>annual predicted generation: <strong>%(annualPredictedGeneration)s</strong>',
        cleanNumbers.generated && cleanNumbers.datetime ? '<br>Was generating <strong>%(generated)s</strong>' : '',
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

    return this.watts(total, 'W');
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
    const str = this.filtersChosen.localAuthorities === 'all' ? 'Oxfordshire' :
                                this.filtersChosen.localAuthorities;

    return str;
  }

  /**
   * Build stats copy about the chosen ownership types
   * @return {String}
   * eg. "Commnity"
   *     "community and council"
   */
  copyOwnershipType() {
    const m = (this.filtersChosen.ownershipType === 'all') ? '' : this.filtersChosen.ownershipType;
    return m + ' energy';
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
   * Callback on mouse out a map marker
   * ( Brings up tooltip )
   * Leaflet by default brings this up on click
   */
  mouseOutMarker(e, args) {
    const marker = this.map.installations[args.modelName];
    this.currentHoverOver = 'out';

    this.$timeout(() => {
      if (args.modelName !== this.currentHoverOver) {
        marker.focus = false;
      }
    }, 300);
  }

  /**
   * Callback on mouse over a map marker
   * ( Brings up tooltip )
   * Leaflet by default brings this up on click
   */
  mouseOverMarker(e, args) {
    let marker = this.map.installations[args.modelName];
    marker.focus = false;
    this.currentHoverOver = args.modelName;

    this.$timeout(() => {
      if (args.modelName === this.currentHoverOver) {
        marker.focus = true;
      }
    }, 300);
  }

  /**
   * Pretty-print watt
   * @param  {Integer} watts
   * @param  {Boolean} force a particular unit
   * @return {String} pretty-printed reading
   */
  watts(watt, forcedUnit = false) {
    let unit = 'W';
    let decimalPlaces = 2;
    let returnWatt = watt;

    if (forcedUnit && forcedUnit === 'W') {

    } else if (forcedUnit && forcedUnit === 'kW') {
      returnWatt = watt / 1000;
      unit = 'kW';
    } else {
      // not forcing any units
      if (watt > 250000) {
        returnWatt = watt / 1000000;
        unit = 'MW';
      } else if (watt > 4000) {
        returnWatt = watt / 1000;
        unit = 'kW';
      }
    }

    if (returnWatt > 10 || unit === 'W') {
      decimalPlaces = 0;
    }

    const cleanWatt = this.$filter('number')(returnWatt, decimalPlaces);
    return cleanWatt + unit;
  }

  /**
   * Load the GeoJSON for the current area
   * @param  {String} name of area
   * @return {Promise}
   */
  loadAreaJSON(name='all') {
    const slugName = slug(name).toLowerCase();
    const url = `/assets/json/${slugName}.json`;

    return this._importGeoJSON(url);
  }

  /**
   * Import GeoJSON with the Oxfordshire boarders to highlight it on the map
   * @return {Promise}
   */
  _importGeoJSON(url='/assets/json/all.json', fillColor='green') {
    // Get the countries geojson data from a JSON
    return this.$http.get(url)
            .success(data => {
              this.map.geojson = {
                data: data,
                style: {
                  fillColor: fillColor,
                  weight: 1,
                  opacity: 0.8,
                  color: fillColor,
                  fillOpacity: 0.05
                }
              };

              this.$timeout(() => {
                const installations = L.geoJson(data);
                const bounds = installations.getBounds();

                this.map.bounds = {
                  southWest: {
                    lat: bounds._southWest.lat,
                    lng: bounds._southWest.lng
                  },
                  northEast: {
                    lat: bounds._northEast.lat,
                    lng: bounds._northEast.lng
                  }
                };
              }, 600);
            });
  }

  setCoords(address) {
    if (address.length < 3) {
      this.filterLocation = false;
      return this.filterInstallations();
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${address},uk&format=json`;

    return this.$http.get(url)
            .success(data => {
              if (!data.length) {
                return;
              }

              this.map.bounds = {};

              this.filterLocation = {
                lat: parseFloat(data[0].lat, 10),
                lng: parseFloat(data[0].lon, 10)
              };

              return this.filterInstallations();
            });
  }

  _getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = this._deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = this._deg2rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this._deg2rad(lat1)) * Math.cos(this._deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
  }

  _deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
}
angular.module('lowcarbonhubApp')
  .component('main', {
    templateUrl: 'app/main/main.html',
    controller: MainController
  });

})();
