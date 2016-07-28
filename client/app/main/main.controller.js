'use strict';

(function() {

class MainController {

  constructor($http) {
    this.$http = $http;

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
      this.map.installations = response.data.map(mapInstallationsToMarkers);
    });
  }
}

function mapInstallationsToMarkers(installation) {
  var marker = {
    draggable: false,
    lat: installation.lat,
    lng: installation.lng,
    message: installation.name + ' :: ' + installation._id
  };

  return marker;
}

angular.module('lowcarbonhubApp')
  .component('main', {
    templateUrl: 'app/main/main.html',
    controller: MainController
  });

})();
