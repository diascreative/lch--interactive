'use strict';

(function() {

class MainController {

  constructor(graphDefault, $http, $filter, $location, $rootScope, $scope, $state, $timeout) {
    this.$http = $http;
    this.$filter = $filter;
    this.$location = $location;
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.$state = $state;
    this.$rootScope = $rootScope;
    this.watts = $rootScope.watts;

    this.currentHoverOver = false;
    this.currentFocus = false;

    this.absUrl = this.$location.protocol() + '://' + this.$location.host();

    this._installations = [];
    this.filterLocation = false;
    this._maxCapacity = 0;

    this.graph = angular.copy(graphDefault);

    this._postCodeMatches = [
        new RegExp(/^([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d[A-Z]{2})$/i), // SW1A+1AA
        new RegExp(/^([A-Z]{1,2}\d\d)$/i),                         // OX25
        new RegExp(/^([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d)$/i),         // SW1A+1
        new RegExp(/^([A-Z]{1,2}\d{1,2}[A-Z]?)\s*$/i)              // SW1A
      ];

    this._postCodeRadius = [
      2,
      15,
      10,
      15,
      40
    ];

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
        //jscs:disable maximumLineLength
        tileLayer: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        //jscs:enable maximumLineLength
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
        this._setInstallation();
        this.loadAreaJSON(this.filtersChosen.localAuthorities);
      });
    });

    if (!L.Browser.touch) {
      this.$scope.$on('leafletDirectiveMarker.mouseover', this.mouseOverMarker.bind(this));
      this.$scope.$on('leafletDirectiveMarker.mouseout', this.mouseOutMarker.bind(this));
      this.$scope.$on('leafletDirectiveMarker.click', this.clickMarker.bind(this));
      this.$scope.$on('leafletDirectiveMap.click', this.closeMarkers.bind(this));
      this.$scope.$on('leafletDirectiveGeoJson.click', this.closeMarkers.bind(this));

      this.$scope.$on('leafletDirectiveMarker.popupopen', this._focusMarker.bind(this));
    }
  }

  clickMarker(e, args) {
    const marker = this.map.installations[args.modelName];
    this.currentHoverOver = args.modelName;
    this._setInstallationFocus(marker, true);

    this.$state.go('installation', { name: marker.name });
  }

  loadHistoricData() {
    const url = `/api/generations/historic`;
    const data = this.filtersChosen;

    return this.$http.get(url, {params: data})
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

  /**
   * Update map markers from this._installations
   * @return {Array} Map markers
   */
  _updateMapMarkers() {
    this._maxCapacity = _.maxBy(this._installations, 'capacity').capacity;
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
    marker.visible = false;
    marker.className = '';

    if (!marker.generated) {
      marker.generated = 0;
    }

    marker.capacity = marker.capacity;

    marker.icon = {
      type: 'div',
      html: '',
      iconSize: [30, 45],
      iconAnchor: [15, 45],
      popupAnchor: [0, -45]
    };

    marker.message = this._mapPopupHTML(marker);

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

    this.searchOwner = this.filtersChosen.ownership;
  }

  _setInstallation() {
    if (!this.$state.includes('installation')) {
      return;
    }

    const installationName = this.$state.params.name;
    const currentMarker= this.map.installations.filter(installation => {
      return installation.name === installationName;
    });

    if (currentMarker.length) {
      this._setInstallationFocus(currentMarker[0], true);
    }
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

  /**
   * Select an installation from the free text search
   * @param  {Object} marker
   */
  filterFreeText(marker = false) {
    if (marker) {
      this.map.installations.map((installationMarker) => {
        this._setInstallationVisibility(installationMarker);
        this._setInstallationFocus(installationMarker);
      });

      this._centerOnMarker(marker);
    } else {
      this.filterInstallations();
      this.$state.go('main');
    }
  }

  filterOwners(ownerName = 'all') {
    this.filtersChosen.ownership = ownerName;

    this.$state.go('filter');
    this.filterInstallations();
  }

  interactWithFilters() {
    this.$state.go('filter');
    this.filterInstallations();
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

    const locationLength = this.address ? this.address.length : 0;
    let locationRadiusIndex = 3;

    if (locationLength > 1) {
      for (let i = 0, len = this._postCodeMatches.length; i < len; i++) {
        if (this.address.match(this._postCodeMatches[i])) {
          locationRadiusIndex = i;
          break;
        }
      }
    }

    let locationRadius = this._postCodeRadius[locationRadiusIndex];

    const visibleItems = [];

    this.$location.hash(newHash);

    this.map.installations.map((installationMarker, index) => {
      const inLas = this.isInCurrentLocalAuthority(installationMarker);
      const belongsTo = this.belongsTo(installationMarker);
      const ownershipType = this.hasOwnerShipType(installationMarker);
      const energyType = this.hasEnergyType(installationMarker);

      let visible =inLas && belongsTo && ownershipType && energyType;

      if (visible && locationLength > 1) {
        // only check the distance if it's visible
        const distance = this._getDistanceFromLatLonInKm(installationMarker.lat,
                                                  installationMarker.lng,
                                                  this.filterLocation.lat,
                                                  this.filterLocation.lng);

        if (distance > locationRadius) {
          visible = false;
        }
      }

      if (visible) {
        visibleItems.push(index);
      }

      this._setInstallationVisibility(installationMarker, visible);
      this._setInstallationFocus(installationMarker);
    });

    if (visibleItems.length === 1) {
      const marker = this.map.installations[visibleItems[0]];
      this._centerOnMarker(marker);
    }

    this._setMapBounds();
    this.loadHistoricData();
  }

  _setInstallationVisibility(installationMarker, visible = false) {
    installationMarker.visible = visible;
    installationMarker.icon.className = visible ? '' : 'leaflet-marker-icon--hidden';
  }

  _setInstallationFocus(installationMarker, focus = false) {
    if (installationMarker.focus === focus) {
      return;
    }

    installationMarker.focus = focus;
  }

  _focusMarker(e, args) {
    if (this.currentFocus === args.modelName) {
      return;
    }

    this._hidePreviousMarker();

    let marker = this.map.installations[args.modelName];
    this.currentFocus = args.modelName;

    if (marker.icon.className.indexOf('leaflet-marker-icon--focus') > -1) {
      return;
    }

    marker.icon.className += ' leaflet-marker-icon--focus';
  }

  _hidePreviousMarker() {
    if (this.currentFocus) {
      let marker = this.map.installations[this.currentFocus];
      marker.focus = false;
      if (marker.icon.className.indexOf('leaflet-marker-icon--focus') > -1) {
        marker.icon.className = '';
      }

      this.currentFocus = false;
    }
  }

  /**
   * Show a marker and move the map to its coordinates
   * @param  {Object} marker
   */
  _centerOnMarker(marker) {
    this._setInstallationVisibility(marker, true);
    this._setInstallationFocus(marker, true);

    this.map.defaults.center.lat = marker.lat;
    this.map.defaults.center.lng = marker.lng;

    this.$state.go('installation', { name: marker.name });
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
      owner: installation.owner,
      capacity: this.watts(installation.capacity),
      annualPredictedGeneration: this.watts(installation.annualPredictedGeneration, false, 'h'),
      generated: this.watts(installation.generated)
    };

    if (installation.datetime) {
      cleanNumbers.datetime = moment(installation.datetime).fromNow();
    }

    const className = slug(installation.energyType).toLowerCase();
    const spaceForBorder = (140 - 60) / 2;
    const iconBorderWidth = spaceForBorder * (installation.capacity / this._maxCapacity);

    const html =
      `<div class="map-popup ${className}">
        <h2>%(name)s</h2>
        <div class="map-popup__graphic">
          <div class="map-popup__capacity">
            <div class="large-text">%(capacity)s</div>
            Capacity
          </div>
          <div class="map-popup__icon-section">
           <div class="map-popup__icon" style="border-width: ${iconBorderWidth}px"></div>
          </div>
        </div>
        <p>
          <span class="large-text">%(annualPredictedGeneration)s</span>
          Annual predicted generation
        </p>
        <p>Owned by: <strong>%(owner)s.</strong></p>
        <p><a href="/installation/${installation.name}">more details</a></p>
      </div>`;

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
   * Get the total capacity from the visible installations
   * @return {String} $filtered sum
   */
  getFilteredTotalCapacity() {
    const visibleInstallations = this._getVisibleInstallations();
    const total = _.sumBy(visibleInstallations, 'capacity');

    return this.watts(total);
  }

  /**
   * Get the total annual predicted generation from the visible installations
   * @return {String} $filtered sum
   */
  getFilteredTotalYearlyGeneration() {
    const total = this.getTotalYearlyGeneration();

    return this.watts(total, false, 'h');
  }

  getTotalYearlyGeneration() {
    const visibleInstallations = this._getVisibleInstallations();
    return _.sumBy(visibleInstallations, 'annualPredictedGeneration');
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


  closeMarkers() {
    this._hidePreviousMarker();

    if (!this.currentHoverOver || this.currentHoverOver === 'out') {
      return;
    }

    const marker = this.map.installations[this.currentHoverOver];
    this.currentHoverOver = 'out';

    this._setInstallationFocus(marker, false);
  }

  /**
   * Callback on mouse out a map marker
   * ( Brings up tooltip )
   * Leaflet by default brings this up on click
   */
  mouseOutMarker(e, args) {
    this.currentHoverOver = 'out';

    this.$timeout(() => {
      if (this.currentHoverOver === 'out') {
        this.currentHoverOver = args.modelName;
      }
    }, 350);
  }

  /**
   * Callback on mouse over a map marker
   * ( Brings up tooltip )
   * Leaflet by default brings this up on click
   */
  mouseOverMarker(e, args) {
    let marker = this.map.installations[args.modelName];

    this.currentHoverOver = args.modelName;

    this.$timeout(() => {
      if (args.modelName === this.currentHoverOver) {
        this._setInstallationFocus(marker, true);
      }
    }, 300);
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
            });
  }

  /**
   * Set the map to encapsulate all the visible markers as best as possible
   * for the window size
   */
  _setMapBounds() {
    const visibleInstallations = this._getVisibleInstallations();

    if (!visibleInstallations.length) {
      return;
    }

    this.map.bounds = {
      southWest: {
        lat: _.minBy(visibleInstallations, 'lat').lat,
        lng: _.minBy(visibleInstallations, 'lng').lng
      },
      northEast: {
        lat: _.maxBy(visibleInstallations, 'lat').lat + 0.0261,
        lng: _.maxBy(visibleInstallations, 'lng').lng
      }
    };
  }

  setCoords(address) {
    if (address.length < 2) {
      this.filterLocation = false;
      return this.filterInstallations();
    }

    let postcode = address.toUpperCase();

    if (postcode.length > 2) {
      let parts;

      for (let i = 0, len = this._postCodeMatches.length; i < len; i++) {
        parts = postcode.match(this._postCodeMatches[i]);

        if (parts) {
          parts.shift();
          postcode = parts.join(' ');
          break;
        }
      }
    }

    const url = `//nominatim.openstreetmap.org/search?q=${postcode},Oxfordshire,uk&format=json`;

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

  globalSocialSharingMessage() {
    const total = _.sumBy(this.map.installations, 'generated');
    const cleanTotal = this.watts(total, 'W', '', false);

    return `${cleanTotal} of #Oxon's #communityenergy is now plugged into the #PeoplesPowerStation. See local energy grow!`;
  }

  // SEO
  pageTitle() {
    const title = 'LCH Interactive';
    let pageTitle = title;

    if (this.$rootScope.title && this.$rootScope.title !== '') {
      pageTitle = `${this.$rootScope.title} | ${pageTitle}`;
    }

    return pageTitle;
  }

  pageDescription() {
    const description = 'LCH Interactive description';
    let pageDescription = description;

    if (this.$rootScope.description && this.$rootScope.description !== '') {
      pageDescription = `${this.$rootScope.description}`;
    }

    return pageDescription;
  }
}

angular.module('lowcarbonhubApp')
  .controller('mainController', MainController);
})();
